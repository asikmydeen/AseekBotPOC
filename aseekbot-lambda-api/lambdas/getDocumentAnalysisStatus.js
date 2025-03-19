const serverless = require('serverless-http');
const express = require('express');
const { handleApiError } = require('../utils/apiErrorHandler');
const AWS = require('aws-sdk');

const app = express();
const stepFunctions = new AWS.StepFunctions();

// Add CORS middleware
app.use((req, res, next) => {
  // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  // Allow specific headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());

// Start document analysis
app.post('/document-analysis/start', async (req, res) => {
  try {
    const { s3Bucket, s3Key, fileType, userId } = req.body;

    // Validate required fields
    if (!s3Bucket || !s3Key || !fileType) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'The s3Bucket, s3Key, and fileType are required.'
      });
    }

    // Generate document ID
    const documentId = `doc-${Date.now()}`;

    // Start the Step Functions workflow
    const params = {
      stateMachineArn: process.env.DOCUMENT_ANALYSIS_STATE_MACHINE_ARN,
      name: `doc-analysis-${documentId}`,
      input: JSON.stringify({
        documentId,
        userId: userId || 'anonymous',
        s3Bucket,
        s3Key,
        fileType,
        isMultipleDocuments: false // Default to single document
      })
    };

    console.log('Starting Step Functions execution:', params);

    const execution = await stepFunctions.startExecution(params).promise();

    return res.json({
      success: true,
      executionArn: execution.executionArn,
      documentId,
      message: 'Document analysis started successfully'
    });
  } catch (error) {
    console.error('Error starting document analysis:', error);
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Get document analysis status
app.get('/document-analysis/status/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        error: 'Missing document ID',
        message: 'Document ID is required'
      });
    }

    // Create DynamoDB client
    const dynamoDB = new AWS.DynamoDB.DocumentClient();

    // Query the status table
    const result = await dynamoDB.get({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE,
      Key: { documentId }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({
        error: 'Document analysis not found',
        message: `No document analysis found with ID: ${documentId}`
      });
    }

    return res.json({
      documentId,
      status: result.Item.status,
      message: result.Item.message,
      timestamp: result.Item.timestamp,
      resultLocation: result.Item.resultLocation
    });
  } catch (error) {
    console.error('Error retrieving document analysis status:', error);
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Add catch-all handler for other request methods
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

module.exports.handler = serverless(app);