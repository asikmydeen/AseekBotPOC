const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { invokeBedrockAgent } = require('../utils/invokeBedrockAgent');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();
// Add better JSON body parsing
app.use(express.json({ strict: false }));
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
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add enhanced debugging middleware
app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Path:', req.path);
  console.log('- Headers:', JSON.stringify(req.headers));
  console.log('- Body (raw):', JSON.stringify(req.body));
  console.log('- Body prompt value:', req.body.prompt);
  next();
});

app.post('*', upload.single('file'), async (req, res) => {
  try {
    // Log the entire request object to see what we're getting
    console.log('Full request body:', JSON.stringify(req.body));

    // Try to extract prompt in different ways
    const prompt = req.body.prompt || req.body.message || (typeof req.body === 'string' ? req.body : null);
    const sessionId = req.body.sessionId;

    console.log('Extracted prompt:', prompt);
    console.log('Extracted Session ID:', sessionId);

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required',
        receivedBody: req.body,
        bodyType: typeof req.body
      });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Check if a file is attached
    let binaryFile;

    if (req.file) {
      const file = req.file;

      binaryFile = {
        name: file.originalname,
        content: new Uint8Array(file.buffer),
        type: file.mimetype,
        useCase: 'CHAT'
      };
    }

    // Invoke the Bedrock agent
    const result = await invokeBedrockAgent(prompt, sessionId, {
      binaryFile
    });

    // Transform the response to match the expected format
    const transformedResponse = {
      text: result.completion,
      sessionId: result.sessionId,
      timestamp: new Date().toISOString(),
    };

    return res.json(transformedResponse);
  } catch (error) {
    console.error('Error processing message:', error);
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