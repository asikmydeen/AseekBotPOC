const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, StartExecutionCommand, DescribeExecutionCommand } = require('@aws-sdk/client-sfn');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { transformS3Url } = require('../utils/invokeBedrockAgent');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sfnClient = new SFNClient();

// Status table name
const STATUS_TABLE = process.env.REQUEST_STATUS_TABLE || 'RequestStatus';
// State machine ARN for document analysis workflow
const DOC_ANALYSIS_STATE_MACHINE = process.env.DOCUMENT_ANALYSIS_STATE_MACHINE_ARN;

/**
 * Update status in DynamoDB
 */
async function updateRequestStatus(requestId, updates) {
    try {
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        // Build update expression dynamically
        Object.entries(updates).forEach(([key, value]) => {
            updateExpression.push(`#${key} = :${key}`);
            expressionAttributeNames[`#${key}`] = key;
            expressionAttributeValues[`:${key}`] = value;
        });

        // Always update the updatedAt timestamp
        updateExpression.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        const params = {
            TableName: STATUS_TABLE,
            Key: { requestId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.send(new UpdateCommand(params));
        console.log(`Status updated for requestId ${requestId}:`, JSON.stringify(updates));
        return result.Attributes;
    } catch (error) {
        console.error(`Error updating status for requestId ${requestId}:`, error);
        throw error;
    }
}

/**
 * Process a standard chat message using Bedrock Agent
 */
async function processChatMessage(requestId, message, history, s3Files, sessionId) {
    try {
        // Update status to PROCESSING
        await updateRequestStatus(requestId, {
            status: 'PROCESSING',
            progress: 25
        });

        // Prepare S3 file info for Bedrock Agent
        const s3FileInfos = s3Files && s3Files.length > 0 ? s3Files.map(file => ({
            name: file.name,
            s3Url: file.s3Url,
            mimeType: file.mimeType || file.type || 'application/octet-stream',
            useCase: 'CODE_INTERPRETER' // Changed from DOCUMENT_ANALYSIS
        })) : [];

        console.log(`Processing message for requestId ${requestId}`, message);
        console.log('S3 files:', JSON.stringify(s3FileInfos));

        // Update status to show progress
        await updateRequestStatus(requestId, {
            progress: 50
        });

        // Invoke Bedrock Agent
        const response = await invokeBedrockAgent(message, sessionId, {
            s3Files: s3FileInfos.length > 0 ? s3FileInfos : undefined,
            agentId: process.env.BEDROCK_AGENT_ID || '7FDALECWCL',
            agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || '11OBDAVIQQ',
            region: process.env.AWS_REGION || 'us-east-1'
        });

        // Update status to COMPLETED with results
        await updateRequestStatus(requestId, {
            status: 'COMPLETED',
            progress: 100,
            result: {
                message: response.completion,
                sessionId: response.sessionId,
                timestamp: new Date().toISOString(),
            }
        });

        console.log(`Chat message processing completed for requestId ${requestId}`);
    } catch (error) {
        console.error(`Error processing chat message for requestId ${requestId}:`, error);

        // Update status to FAILED
        await updateRequestStatus(requestId, {
            status: 'FAILED',
            error: {
                message: error.message,
                name: error.name
            }
        });

        throw error;
    }
}

/**
 * Start document analysis workflow using Step Functions
 */
async function startDocumentAnalysis(requestId, s3Files, message, sessionId) {
    try {
        if (!s3Files || !s3Files.length || !s3Files[0].s3Url) {
            throw new Error('No valid files provided for document analysis');
        }

        const file = s3Files[0];
        const s3Url = file.s3Url;

        // Extract bucket and key from S3 URL
        let s3Bucket, s3Key;

        if (s3Url.startsWith('https://')) {
            const url = new URL(s3Url);
            s3Bucket = url.hostname.split('.')[0];
            s3Key = url.pathname.substring(1); // Remove leading slash
        } else if (s3Url.startsWith('s3://')) {
            const parts = s3Url.substring(5).split('/');
            s3Bucket = parts[0];
            s3Key = parts.slice(1).join('/');
        } else {
            throw new Error(`Invalid S3 URL format: ${s3Url}`);
        }

        // Determine file type from name or MIME type
        const fileName = file.name || s3Key.split('/').pop() || '';
        const fileExt = fileName.split('.').pop().toLowerCase();
        const fileType = fileExt || file.mimeType?.split('/').pop() || 'unknown';

        console.log(`Starting document analysis for file: ${fileName}, type: ${fileType}`);
        console.log(`User query: ${message}`);

        // Update status to PROCESSING
        await updateRequestStatus(requestId, {
            status: 'PROCESSING',
            progress: 25,
            message: `Analyzing document: ${fileName}`
        });

        // Prepare input for Step Functions
        const input = {
            documentId: requestId,
            userId: sessionId || 'anonymous',
            s3Bucket,
            s3Key,
            fileType,
            userQuery: message,
            isMultipleDocuments: false,
            startedBy: 'async-worker'
        };

        // Start Step Functions execution
        const sfnParams = {
            stateMachineArn: DOC_ANALYSIS_STATE_MACHINE,
            name: `doc-analysis-${requestId}`,
            input: JSON.stringify(input)
        };

        console.log('Starting Step Functions execution with params:', JSON.stringify(sfnParams));

        const command = new StartExecutionCommand(sfnParams);
        const response = await sfnClient.send(command);

        // Update status with Step Functions execution ARN
        await updateRequestStatus(requestId, {
            status: 'PROCESSING',
            progress: 25,
            stepFunctionsExecution: {
                executionArn: response.executionArn,
                startTime: response.startDate?.toISOString() || new Date().toISOString()
            }
        });

        console.log(`Document analysis started with execution ARN: ${response.executionArn}`);

        // Monitor the Step Functions execution until completion or timeout
        let executionComplete = false;
        let retryCount = 0;
        const maxRetries = 120; // 10 minutes at 5 second intervals
        let executionResult = null;

        while (!executionComplete && retryCount < maxRetries) {
            try {
                // Get the current state of the execution
                const describeParams = {
                    executionArn: response.executionArn
                };

                const execution = await sfnClient.send(new DescribeExecutionCommand(describeParams));

                // Calculate progress based on execution status
                const startTime = new Date(execution.startDate).getTime();
                const currentTime = new Date().getTime();
                const elapsedTime = currentTime - startTime;
                const estimatedTotalTime = 5 * 60 * 1000; // 5 minutes estimated total time
                const progress = Math.min(90, 25 + Math.floor((elapsedTime / estimatedTotalTime) * 65));

                // Update progress
                await updateRequestStatus(requestId, {
                    progress
                });

                // Check if execution is complete
                if (execution.status === 'SUCCEEDED') {
                    executionComplete = true;
                    executionResult = execution.output;
                    console.log(`Execution completed successfully: ${execution.executionArn}`);
                } else if (execution.status === 'FAILED' || execution.status === 'TIMED_OUT' || execution.status === 'ABORTED') {
                    executionComplete = true;
                    console.error(`Execution failed: ${execution.executionArn} - Status: ${execution.status}`);
                    throw new Error(`Step Functions execution failed with status: ${execution.status}`);
                } else {
                    // Wait 5 seconds before checking again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    retryCount++;
                }
            } catch (error) {
                console.error(`Error checking execution status: ${error.message}`);
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 5000));
                retryCount++;

                // If we've retried too many times, throw the error
                if (retryCount >= maxRetries) {
                    throw error;
                }
            }
        }

        if (!executionComplete) {
            console.log(`Execution still in progress after maximum wait time: ${response.executionArn}`);
            // Continue processing anyway, but use Bedrock to summarize what we have so far
        }

        // Process the results and use Bedrock to create a summary
        try {
            let analysisResults = {};
            let insights = {};

            // If we have execution results, parse and use them
            if (executionResult) {
                try {
                    const resultData = JSON.parse(executionResult);
                    analysisResults = resultData.analysisResults || {};
                    insights = resultData.insights || {};
                } catch (parseError) {
                    console.error(`Error parsing execution results: ${parseError.message}`);
                }
            }

            // Use Bedrock to create a summary
            const summaryPrompt = `
            You are an assistant analyzing a document in response to a user query.

            Original User Query: "${message}"

            Document Analysis Summary:
            ${JSON.stringify(insights, null, 2)}

            Extracted Document Information:
            ${JSON.stringify(analysisResults, null, 2)}

            Based on this document analysis, please provide a comprehensive response to the user's query.
            Make sure to directly address the user's question and highlight the most relevant information from the document.
            Be concise but thorough, and format your response in a clear and readable manner.
            `;

            console.log(`Generating summary for requestId ${requestId}`);

            // Invoke Bedrock Agent
            const summaryResponse = await invokeBedrockAgent(summaryPrompt, sessionId, {
                agentId: process.env.BEDROCK_AGENT_ID || '7FDALECWCL',
                agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || '11OBDAVIQQ',
                region: process.env.AWS_REGION || 'us-east-1'
            });

            // Update status to COMPLETED with results
            await updateRequestStatus(requestId, {
                status: 'COMPLETED',
                progress: 100,
                result: {
                    message: summaryResponse.completion,
                    fileName: file.name,
                    insights,
                    documentType: analysisResults.documentType || 'Unknown',
                    sessionId,
                    timestamp: new Date().toISOString(),
                },
                documentAnalysis: {
                    completed: true,
                    executionArn: response.executionArn,
                    fileName: file.name,
                    fileType
                }
            });

            console.log(`Document analysis and summary completed for requestId ${requestId}`);
            return true;
        } catch (summaryError) {
            console.error(`Error creating summary: ${summaryError.message}`);
            throw summaryError;
        }
    } catch (error) {
        console.error(`Error starting document analysis for requestId ${requestId}:`, error);

        // Update status to FAILED
        await updateRequestStatus(requestId, {
            status: 'FAILED',
            error: {
                message: error.message,
                name: error.name
            }
        });

        throw error;
    }
}

/**
 * Main handler for SQS messages
 */
exports.handler = async (event) => {
    console.log('Processing SQS message:', JSON.stringify(event));

    // Process each message in the batch (typically only one with batchSize: 1)
    for (const record of event.Records) {
        try {
            const body = JSON.parse(record.body);
            const { requestId, message, history, s3Files, sessionId, documentAnalysis } = body;

            console.log(`Processing request ${requestId}`);

            // Determine request type from message attributes if available
            const requestType = record.messageAttributes?.RequestType?.stringValue ||
                (documentAnalysis ? 'DOCUMENT_ANALYSIS' : 'CHAT_MESSAGE');

            if (requestType === 'DOCUMENT_ANALYSIS') {
                // Start document analysis workflow
                await startDocumentAnalysis(requestId, s3Files, message, sessionId);
            } else {
                // Process standard chat message
                await processChatMessage(requestId, message, history, s3Files, sessionId);
            }
        } catch (error) {
            console.error('Error processing SQS message:', error);

            // Don't throw here to avoid retrying the entire batch
            // We've already updated the status to FAILED in the specific processing functions
        }
    }

    // Return success to avoid retrying the entire batch
    return {
        batchItemFailures: []
    };
};