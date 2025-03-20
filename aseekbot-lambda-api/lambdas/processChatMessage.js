const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();

// Add proper CORS headers to ALL responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Initialize clients
const sqsClient = new SQSClient();
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Status table name
const STATUS_TABLE = process.env.REQUEST_STATUS_TABLE || 'RequestStatus';

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

// Main route handler with error handling
app.post('*', upload.array('files'), async (req, res) => {
  try {
    // Ensure CORS headers are set for this response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    const prompt = req.body.message;
    let sessionId = req.body.sessionId || `session-${Date.now()}`;
    const requestId = uuidv4();

    console.log('Processing message:', prompt);
    console.log('Session ID:', sessionId);

    if (!prompt) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check for documents (either uploaded files or S3 references)
    let hasDocument = false;
    let s3FileInfos = [];

    // Process uploaded files
    const files = req.files || [];
    if (files.length > 0) {
      hasDocument = true;
      console.log(`Processing ${files.length} uploaded files`);
    }

    // Process S3 file references
    if (req.body.s3Files) {
      try {
        let parsedFiles;
        if (typeof req.body.s3Files === 'string') {
          parsedFiles = JSON.parse(req.body.s3Files);
        } else {
          parsedFiles = req.body.s3Files;
        }

        console.log('Parsed S3 files:', JSON.stringify(parsedFiles, null, 2));

        if (parsedFiles && parsedFiles.length > 0) {
          hasDocument = true;
          s3FileInfos = parsedFiles.map(file => ({
            name: file.name,
            s3Url: file.s3Url,
            mimeType: file.mimeType || file.type || 'application/octet-stream',
            useCase: 'CODE_INTERPRETER' // Changed from DOCUMENT_ANALYSIS
          }));
        }
      } catch (parseError) {
        console.error('Error parsing S3 files:', parseError);
      }
    }

    console.log('Has document:', hasDocument);
    console.log('S3 file infos:', JSON.stringify(s3FileInfos, null, 2));

    // If documents are present, use the async document analysis workflow
    if (hasDocument) {
      // Create status record in DynamoDB
      const statusItem = {
        requestId,
        sessionId,
        status: 'QUEUED',
        message: prompt,
        timestamp: new Date().toISOString(),
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDocumentAnalysis: true
      };

      await docClient.send(new PutCommand({
        TableName: STATUS_TABLE,
        Item: statusItem
      }));

      // Send message to SQS for document analysis
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify({
          requestId,
          message: prompt,
          history: [],
          s3Files: s3FileInfos,
          sessionId,
          documentAnalysis: true
        }),
        MessageAttributes: {
          RequestType: {
            DataType: 'String',
            StringValue: 'DOCUMENT_ANALYSIS'
          }
        }
      }));

      console.log(`Document analysis request ${requestId} queued successfully`);

      // Return immediate response with request ID
      return res.json({
        requestId,
        status: 'QUEUED',
        message: 'Your document is being analyzed. Please check the status endpoint for updates.',
        timestamp: new Date().toISOString(),
        progress: 0
      });
    } else {
      // For regular chat without documents, process directly
      const binaryFiles = files.map(file => ({
        name: file.originalname,
        content: file.buffer,
        type: file.mimetype,
        useCase: 'CHAT'
      }));

      // Invoke Bedrock agent directly for non-document messages
      const response = await invokeBedrockAgent(prompt, sessionId, {
        binaryFile: binaryFiles.length > 0 ? binaryFiles[0] : undefined,
        s3Files: s3FileInfos.length > 0 ? s3FileInfos : undefined,
        agentId: process.env.BEDROCK_AGENT_ID || '7FDALECWCL',
        agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || '11OBDAVIQQ',
        region: process.env.AWS_REGION || 'us-east-1'
      });

      return res.json({
        message: response.completion,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error processing chat message:', error);

    // Ensure CORS headers are set even on error responses
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Catch-all handler
app.all('*', (req, res) => {
  // Ensure CORS headers are set on 404 responses too
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

// Export the serverless handler
module.exports.handler = serverless(app, {
  // Add binary support to ensure form data is parsed correctly
  binary: ['multipart/form-data']
});