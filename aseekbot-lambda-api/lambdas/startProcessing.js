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
    next();
});

app.post('*', async (req, res) => {
    try {
        // Extract request data
        const { message, history, s3Files, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Generate a unique request ID
        const requestId = uuidv4();
        const timestamp = new Date().toISOString();

        // Create status record in DynamoDB
        const statusItem = {
            requestId,
            sessionId: sessionId || `session-${Date.now()}`,
            status: 'QUEUED',
            message,
            timestamp,
            progress: 0,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await docClient.send(new PutCommand({
            TableName: process.env.REQUEST_STATUS_TABLE || 'RequestStatus',
            Item: statusItem
        }));

        // Send message to SQS
        await sqsClient.send(new SendMessageCommand({
            QueueUrl: process.env.SQS_QUEUE_URL,
            MessageBody: JSON.stringify({
                requestId,
                message,
                history: history || [],
                s3Files: s3Files || [],
                sessionId: sessionId || `session-${Date.now()}`
            }),
            MessageAttributes: {
                RequestType: {
                    DataType: 'String',
                    StringValue: 'CHAT_MESSAGE'
                }
            }
        }));

        console.log(`Request ${requestId} queued successfully`);

        // Return immediate response with request ID
        return res.json({
            requestId,
            status: 'QUEUED',
            message: 'Your request has been queued for processing',
            timestamp,
            progress: 0
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