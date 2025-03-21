const serverless = require('serverless-http');
const express = require('express');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SFNClient, DescribeExecutionCommand } = require('@aws-sdk/client-sfn');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sfnClient = new SFNClient();

// Status table name
const STATUS_TABLE = process.env.REQUEST_STATUS_TABLE || 'RequestStatus';

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Add debugging middleware
app.use((req, res, next) => {
    console.log('Request received:');
    console.log('- Method:', req.method);
    console.log('- URL:', req.url);
    console.log('- Path:', req.path);
    console.log('- Params:', req.params);
    console.log('- Query:', req.query);
    next();
});

// Handle dynamic routes with proxy+
app.get('/status/:requestId', getStatusHandler);
app.get('/*/status/:requestId', getStatusHandler); // Handle nested paths
app.get('*/status/:requestId', getStatusHandler);  // Handle any prefix

// Also support direct requestId in URL param for maximum flexibility
app.get('/:requestId', (req, res, next) => {
    // Only handle if it looks like a request ID (UUID format)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.requestId)) {
        return getStatusHandler(req, res, next);
    }
    next();
});

// Handle summary endpoint
app.get('/summary', getSummaryHandler);
app.get('/*/summary', getSummaryHandler); // Handle nested paths

// Main status handler function
async function getStatusHandler(req, res, next) {
    try {
        const requestId = req.params.requestId;

        if (!requestId) {
            return res.status(400).json({ error: 'Request ID is required' });
        }

        console.log(`Checking status for request: ${requestId}`);

        // Get status from DynamoDB
        const params = {
            TableName: STATUS_TABLE,
            Key: { requestId }
        };

        const result = await docClient.send(new GetCommand(params));

        if (!result.Item) {
            return res.status(404).json({
                error: 'Request not found',
                message: `No request found with ID: ${requestId}`
            });
        }

        const statusItem = result.Item;

        // For document analysis requests with step functions, check current status
        if (statusItem.status === 'PROCESSING' && statusItem.stepFunctionsExecution) {
            try {
                const sfnParams = {
                    executionArn: statusItem.stepFunctionsExecution.executionArn
                };

                const sfnResult = await sfnClient.send(new DescribeExecutionCommand(sfnParams));

                // Update with latest status from Step Functions
                if (sfnResult.status === 'SUCCEEDED') {
                    statusItem.status = 'COMPLETED';
                    statusItem.progress = 100;

                    // If there's output, parse and include it
                    if (sfnResult.output) {
                        try {
                            const outputData = JSON.parse(sfnResult.output);

                            // Log the entire outputData structure for debugging
                            console.log('Step Functions output data structure:', JSON.stringify(outputData, null, 2));

                            // Improved insights field handling with multiple checks
                            let insightsValue = null;

                            // Check 1: Nested in outputData.statusUpdate.Payload.insights
                            if (outputData.statusUpdate && outputData.statusUpdate.Payload && outputData.statusUpdate.Payload.insights) {
                                console.log('Found insights in outputData.statusUpdate.Payload.insights');
                                insightsValue = outputData.statusUpdate.Payload.insights;
                            }
                            // Check 2: Direct outputData.insights
                            else if (outputData.insights) {
                                console.log('Found insights directly in outputData.insights');
                                insightsValue = outputData.insights;
                            }
                            // Check 3: Nested in outputData.result.insights
                            else if (outputData.result && outputData.result.insights) {
                                console.log('Found insights in outputData.result.insights');
                                insightsValue = outputData.result.insights;
                            }
                            // Check 4: Already in statusItem.insights
                            else if (statusItem.insights) {
                                console.log('Using existing insights from statusItem.insights');
                                insightsValue = statusItem.insights;
                            }
                            // Fallback
                            else {
                                console.warn('Warning: Insights field is missing in all expected locations');
                                insightsValue = 'Insights not available';
                            }

                            statusItem.result = {
                                insights: insightsValue,
                                documentAnalysis: {
                                    completed: true,
                                    timestamp: new Date().toISOString()
                                }
                            };
                        } catch (parseError) {
                            console.error('Error parsing Step Functions output:', parseError);
                        }
                    }
                } else if (sfnResult.status === 'FAILED' || sfnResult.status === 'TIMED_OUT' || sfnResult.status === 'ABORTED') {
                    statusItem.status = 'FAILED';
                    statusItem.error = {
                        message: `Step Functions execution ${sfnResult.status}`,
                        name: 'StepFunctionsError'
                    };
                } else {
                    // Still in progress, calculate approximate progress
                    const startTime = new Date(statusItem.stepFunctionsExecution.startTime).getTime();
                    const currentTime = new Date().getTime();
                    const elapsed = currentTime - startTime;

                    // Assume document analysis takes about 2 minutes on average
                    const estimatedTotalTime = 2 * 60 * 1000;
                    const estimatedProgress = Math.min(95, Math.floor((elapsed / estimatedTotalTime) * 100));

                    statusItem.progress = estimatedProgress;
                }
            } catch (sfnError) {
                console.error('Error checking Step Functions status:', sfnError);
                // Don't fail the request if Step Functions check fails
            }
        }

        return res.json(statusItem);
    } catch (error) {
        console.error('Error checking request status:', error);
        const errorResponse = handleApiError(error);
        return res.status(errorResponse.status || 500).json(errorResponse.body);
    }
}

// Summary handler function
async function getSummaryHandler(req, res) {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // This is a simplified implementation
        // In production, you'd want to use a query with an index on sessionId
        return res.status(501).json({
            message: 'This endpoint is not yet implemented',
            note: 'In production, you would query with a GSI on sessionId'
        });
    } catch (error) {
        console.error('Error getting summary:', error);
        const errorResponse = handleApiError(error);
        return res.status(errorResponse.status || 500).json(errorResponse.body);
    }
}

// Add catch-all handler
app.all('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        requestedPath: req.path,
        method: req.method
    });
});

module.exports.handler = serverless(app);
