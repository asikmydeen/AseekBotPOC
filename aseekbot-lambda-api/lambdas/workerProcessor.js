const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
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
            useCase: file.useCase || 'CHAT'
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
async function startDocumentAnalysis(requestId, s3Files, userId) {
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

        // Prepare input for Step Functions
        const input = {
            documentId: requestId,
            userId: userId || 'anonymous',
            s3Bucket,
            s3Key,
            fileType,
            isMultipleDocuments: false, // Set to true if processing multiple documents
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
            const { requestId, message, history, s3Files, sessionId } = body;

            console.log(`Processing request ${requestId}`);

            // Determine request type from message attributes if available
            const requestType = record.messageAttributes?.RequestType?.stringValue ||
                'CHAT_MESSAGE'; // Default to chat message

            if (requestType === 'DOCUMENT_ANALYSIS') {
                // Start document analysis workflow
                await startDocumentAnalysis(requestId, s3Files, sessionId);
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