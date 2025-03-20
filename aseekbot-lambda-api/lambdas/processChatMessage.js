const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();

// Add proper CORS headers to ALL responses
app.use((req, res, next) => {
  // Must be set on ALL responses including error responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight requests
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

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Middleware error:', err);

  // Ensure CORS headers are set even on error responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
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

// Main route handler with error handling
app.post('*', upload.array('files'), async (req, res) => {
  try {
    // Ensure CORS headers are set for this response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    const prompt = req.body.message;
    let sessionId = req.body.sessionId;
    console.log('Processing message:', prompt);
    console.log('Session ID:', sessionId);

    if (!sessionId) {
      sessionId = uuidv4();
    }

    let s3FileInfos = [];
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
          s3FileInfos = parsedFiles.map(file => ({
            name: file.name,
            s3Url: file.s3Url,
            mimeType: file.mimeType || file.type || 'application/octet-stream',
            useCase: file.useCase
          }));
        }
      } catch (parseError) {
        console.error('Error parsing S3 files:', parseError);
      }
    }

    console.log('Using S3 file infos:', JSON.stringify(s3FileInfos, null, 2));

    const files = req.files || [];
    const binaryFiles = files.map(file => ({
      name: file.originalname,
      content: file.buffer,
      type: file.mimetype,
      useCase: 'CHAT'  // Default useCase
    }));

    const response = await invokeBedrockAgent(prompt, sessionId, {
      binaryFile: binaryFiles.length > 0 ? binaryFiles[0] : undefined,
      s3Files: s3FileInfos.length > 0 ? s3FileInfos : undefined,
      agentId: '7FDALECWCL',
      agentAliasId: '11OBDAVIQQ',
      region: 'us-east-1'
    });

    return res.json({
      message: response.completion,
      sessionId: response.sessionId,
      timestamp: new Date().toISOString(),
    });
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