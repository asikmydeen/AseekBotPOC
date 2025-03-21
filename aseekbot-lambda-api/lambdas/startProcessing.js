const serverless = require('serverless-http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
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

        // Return immediate response with request ID
        return res.json({
            requestId,
            status: 'QUEUED',
            message: isDocumentAnalysis
                ? 'Your document is being analyzed. Please check the status endpoint for updates.'
                : 'Your request has been queued for processing',
            timestamp,
            progress: 0,
            isDocumentAnalysis
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