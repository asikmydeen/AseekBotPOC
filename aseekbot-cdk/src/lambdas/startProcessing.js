const serverless = require('serverless-http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();

// Set up AWS clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient();

// Add JSON body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

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
    console.log('- Headers:', JSON.stringify(req.headers));
    console.log('- Body type:', typeof req.body);
    console.log('- Body:', JSON.stringify(req.body, null, 2));
    next();
});

app.post('*', async (req, res) => {
    try {
        // Extract request data
        const { message, history, s3Files, sessionId, documentAnalysis: explicitDocAnalysis } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate a unique request ID
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();
        const sessionIdentifier = sessionId || `session-${Date.now()}`;

        // Determine if this should be a document analysis request
        const hasFiles = s3Files && Array.isArray(s3Files) && s3Files.length > 0;
        const isDocumentAnalysis = explicitDocAnalysis || hasFiles;

        console.log(`Request type detection: hasFiles=${hasFiles}, explicitDocAnalysis=${explicitDocAnalysis}, isDocumentAnalysis=${isDocumentAnalysis}`);

        // Create status record in DynamoDB
        const statusItem = {
            requestId,
            sessionId: sessionIdentifier,
            status: 'QUEUED',
            message,
            timestamp,
            progress: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
            isDocumentAnalysis: isDocumentAnalysis
        };

        await docClient.send(new PutCommand({
            TableName: process.env.REQUEST_STATUS_TABLE || 'RequestStatus',
            Item: statusItem
        }));

        // Process S3 file references if present
        let processedS3Files = [];
        if (hasFiles) {
            processedS3Files = s3Files.map(file => ({
                name: file.name,
                s3Url: file.s3Url,
                mimeType: file.mimeType || file.type || 'application/octet-stream',
                // Use CODE_INTERPRETER instead of DOCUMENT_ANALYSIS for Bedrock compatibility
                useCase: "CODE_INTERPRETER"
            }));
            console.log('Processed S3 files:', JSON.stringify(processedS3Files, null, 2));
        }

        // Send message to SQS
        const messageBody = {
            requestId,
            message,
            history: history || [],
            s3Files: processedS3Files,
            sessionId: sessionIdentifier,
            documentAnalysis: isDocumentAnalysis
        };

        await sqsClient.send(new SendMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify(messageBody),
            MessageAttributes: {
                RequestType: {
                    DataType: 'String',
                    StringValue: isDocumentAnalysis ? 'DOCUMENT_ANALYSIS' : 'CHAT_MESSAGE'
                }
            }
        }));

        console.log(`Request ${requestId} queued successfully (Document analysis: ${isDocumentAnalysis})`);

        // Record user interaction in DynamoDB
        try {
            const userId = req.body.userId || 'anonymous';

            // Extract chatId from request body - CRITICAL for conversation continuity
            const providedChatId = req.body.chatId;

            // Log warning if chatId is missing - this helps diagnose frontend issues
            if (!providedChatId) {
                console.warn('WARNING: No chatId provided in request. This may cause conversation fragmentation.');
                console.warn('Request details:', {
                    path: req.path,
                    userId,
                    sessionId: sessionIdentifier,
                    hasMessage: !!message,
                    timestamp: new Date().toISOString()
                });
            }

            // Always use the provided chatId, only generate as last resort
            const chatId = providedChatId || `chat-${Date.now()}-${uuidv4().substring(0, 8)}`;
            console.log('Chat ID:', chatId, providedChatId ? '(from request)' : '(NEWLY GENERATED - conversation continuity at risk)');

            // Get the next message order for this chat - using the persistent chatId
            let messageOrder = 1;
            try {
                console.log(`Getting next message order for chatId: ${chatId}`);

                // First try using the GSI for efficient querying
                try {
                    const queryParams = {
                        TableName: process.env.USER_INTERACTIONS_TABLE || 'UserInteractions',
                        IndexName: 'chatId-timestamp-index',
                        KeyConditionExpression: 'chatId = :chatId',
                        ExpressionAttributeValues: {
                            ':chatId': chatId
                        },
                        Select: 'COUNT'
                    };

                    const result = await docClient.send(new QueryCommand(queryParams));
                    messageOrder = (result.Count || 0) + 1;
                    console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via GSI)`);
                } catch (gsiError) {
                    // If the primary GSI fails, try an alternative approach
                    console.warn(`GSI query failed for chatId ${chatId}: ${gsiError.message}. Trying alternative approach...`);

                    try {
                        // Try a different index if available
                        const altQueryParams = {
                            TableName: process.env.USER_INTERACTIONS_TABLE || 'UserInteractions',
                            IndexName: 'chatId-index', // Try alternative index name
                            KeyConditionExpression: 'chatId = :chatId',
                            ExpressionAttributeValues: {
                                ':chatId': chatId
                            }
                        };

                        const altResult = await docClient.send(new QueryCommand(altQueryParams));
                        messageOrder = (altResult.Items?.length || 0) + 1;
                        console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via alternative GSI)`);
                    } catch (altError) {
                        // If all GSI approaches fail, try a scan as last resort
                        console.warn(`Alternative GSI query failed for chatId ${chatId}: ${altError.message}. Trying scan fallback...`);

                        try {
                            // Last resort: scan the table with a filter (less efficient but works as backup)
                            const scanParams = {
                                TableName: process.env.USER_INTERACTIONS_TABLE || 'UserInteractions',
                                FilterExpression: 'chatId = :chatId',
                                ExpressionAttributeValues: {
                                    ':chatId': chatId
                                }
                            };

                            const scanResult = await docClient.send(new ScanCommand(scanParams));
                            messageOrder = (scanResult.Items?.length || 0) + 1;
                            console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via table scan - less efficient)`);
                        } catch (scanError) {
                            console.error(`All methods to get message order for chatId ${chatId} failed:`, scanError);
                            throw scanError; // Pass to outer catch block
                        }
                    }
                }
            } catch (error) {
                console.error(`Error getting message order for chatId ${chatId}:`, error);
                console.log(`Defaulting to message order 1 for chatId ${chatId}`);
                // Default to 1 if there's an error
                messageOrder = 1;
            }

            /**
             * Create user interaction record with proper chat context
             * - Uses provided chatId from request if available
             * - Maintains message ordering within the same chat
             * - Links the interaction to the current processing request
             */
            const userInteraction = {
                userId,
                sessionId: sessionIdentifier,
                requestId,
                query: message,
                response: null, // Response not generated yet
                isDocumentAnalysis,
                voteUp: 0,
                voteDown: 0,
                fileCount: hasFiles ? processedS3Files.length : 0,
                timestamp: Date.now(), // Use numeric timestamp for sorting
                createdAt: timestamp,
                chatId: chatId,
                messageOrder: messageOrder
            };

            await docClient.send(new PutCommand({
                TableName: process.env.USER_INTERACTIONS_TABLE || 'UserInteractions',
                Item: userInteraction
            }));

            console.log(`User interaction recorded for request ${requestId}`);
            console.log(`- chatId: ${chatId} (${req.body.chatId ? 'from request' : 'generated'})`);
            console.log(`- messageOrder: ${messageOrder}`);
            console.log(`- sessionId: ${sessionIdentifier}`);
        } catch (interactionError) {
            // Log error but don't block the main operation
            console.error('Error recording user interaction:', interactionError);
        }

        // Return immediate response with request ID and chatId
        return res.json({
            requestId,
            status: 'QUEUED',
            message: isDocumentAnalysis
                ? 'Your document is being analyzed. Please check the status endpoint for updates.'
                : 'Your request has been queued for processing',
            timestamp,
            progress: 0,
            isDocumentAnalysis,
            chatId: chatId, // Include chatId in the response for client reference
            messageOrder: messageOrder // Include messageOrder in the response for client reference
        });
    } catch (error) {
        console.error('Error processing request:', error);
        const errorResponse = handleApiError(error);
        return res.status(errorResponse.status || 500).json(errorResponse.body);
    }
});

// Catch-all handler
app.all('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        requestedPath: req.path,
        method: req.method
    });
});

module.exports.handler = serverless(app);
