const serverless = require('serverless-http');
const express = require('express');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();

// Add raw body parsing middleware
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
app.use(express.urlencoded({ extended: true }));

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Path:', req.path);
  console.log('- Body:', JSON.stringify(req.body));
  console.log('- Headers:', JSON.stringify(req.headers));
  next();
});

// Define your route handler for any path
app.post('*', async (req, res) => {
  try {
    console.log('Handler executing for path:', req.path);
    const { action, parameter } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    let response;

    switch (action) {
      case 'getHelp':
        response = getHelpResponse();
        break;
      case 'getStarted':
        response = getStartedResponse();
        break;
      case 'showOptions':
        response = showOptionsResponse(parameter || '');
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.json(response);
  } catch (error) {
    console.error('Error processing quickLink request:', error);
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Helper function to generate response for 'getHelp' action
function getHelpResponse() {
  return {
    message: 'Here are some commands you can use:',
    options: [
      { label: 'Create Ticket', value: 'createTicket' },
      { label: 'Upload File', value: 'uploadFile' },
      { label: 'Chat', value: 'chat' }
    ]
  };
}

// Helper function to generate response for 'getStarted' action
function getStartedResponse() {
  return {
    message: 'Welcome to AseekBot! How can I assist you today?',
    options: [
      { label: 'Create a new support ticket', value: 'createTicket' },
      { label: 'Chat with support', value: 'chat' },
      { label: 'View documentation', value: 'docs' }
    ]
  };
}

// Helper function to generate response for 'showOptions' action
function showOptionsResponse(parameter) {
  // Different options based on the parameter
  switch (parameter) {
    case 'ticket':
      return {
        message: 'Ticket options:',
        options: [
          { label: 'Create new ticket', value: 'createTicket' },
          { label: 'View my tickets', value: 'viewTickets' }
        ]
      };
    case 'support':
      return {
        message: 'Support options:',
        options: [
          { label: 'Chat with agent', value: 'chatAgent' },
          { label: 'View knowledge base', value: 'knowledgeBase' }
        ]
      };
    default:
      return {
        message: 'General options:',
        options: [
          { label: 'Get help', value: 'getHelp' },
          { label: 'Start over', value: 'getStarted' }
        ]
      };
  }
}

// Add a catch-all route for troubleshooting
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

module.exports.handler = serverless(app);