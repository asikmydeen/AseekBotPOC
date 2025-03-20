const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();
app.use(express.json());

// Updated CORS middleware section in lambdas/processChatMessage.js
app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');

  // Allow specific HTTP methods
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Allow specific headers
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
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
    const prompt = req.body.message;
    let sessionId = req.body.sessionId;
    console.log('Processing message:', prompt);
    console.log('Session ID:', sessionId);

    if (!sessionId) {
      sessionId = uuidv4();
    }

    let s3FileInfos = [];
    if (req.body.s3Files) {
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
    }

    console.log('Using S3 file infos:', JSON.stringify(s3FileInfos, null, 2));

    const files = req.files || [];
    const binaryFiles = files.map(file => ({
      name: file.originalname,
      content: file.buffer,
      type: file.mimetype,
      useCase: normalizeUseCase(file.useCase, file.mimetype)
    }));

    const response = await invokeBedrockAgent(prompt, sessionId, {
      binaryFile: binaryFiles.length > 0 ? binaryFiles[0] : undefined, // Assuming only one file for simplicity
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
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

module.exports.handler = serverless(app);