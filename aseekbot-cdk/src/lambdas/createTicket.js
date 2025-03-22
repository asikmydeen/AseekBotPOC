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
  next();
});

// Use a wildcard path to catch all routes
app.post('*', async (req, res) => {
  try {
    console.log('Handler executing for path:', req.path);
    const ticketData = req.body;

    if (!ticketData.title || !ticketData.description || !ticketData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate a unique ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create timestamps for the ticket
    const currentTime = new Date().toISOString();

    // Simulate processing delay (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Prepare the response with the created ticket
    const ticketResponse = {
      ...ticketData,
      id: ticketId,
      status: 'open',
      createdAt: currentTime,
      updatedAt: currentTime
    };

    // Return the response
    return res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: ticketResponse
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Add a catch-all route for troubleshooting
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

module.exports.handler = serverless(app);