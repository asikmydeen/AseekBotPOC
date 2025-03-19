const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();
app.use(express.json());
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

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Path:', req.path);
  console.log('- Body type:', typeof req.body);
  next();
});

app.post('*', upload.array('files'), async (req, res) => {
  try {
    // Extract form data
    const prompt = req.body.message;
    let sessionId = req.body.sessionId;

    console.log('Processing message:', prompt);
    console.log('Session ID:', sessionId);

    // Generate a sessionId if not provided
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Process S3 file references if any
    let s3FileInfos = [];
    if (req.body.s3Files) {
      try {
        const parsedFiles = JSON.parse(req.body.s3Files);

        if (parsedFiles && parsedFiles.length > 0) {
          s3FileInfos = parsedFiles.map(file => ({
            name: file.name,
            s3Url: file.s3Url,
            mimeType: file.mimeType,
            useCase: file.useCase
          }));
        }
      } catch (error) {
        console.error('Error parsing s3Files:', error);
      }
    }

    // Invoke the Bedrock agent
    const response = await invokeBedrockAgent(prompt, sessionId, {
      s3Files: s3FileInfos.length > 0 ? s3FileInfos : undefined,
      agentId: '7FDALECWCL',
      agentAliasId: 'NMGKRJLDQQ',
      region: 'us-east-1'
    });

    // Return the response
    return res.json({
      message: response.completion,
      sessionId: response.sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
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