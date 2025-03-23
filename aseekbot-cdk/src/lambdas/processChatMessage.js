const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
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

// Table names
const STATUS_TABLE = process.env.REQUEST_STATUS_TABLE || 'RequestStatus';
const USER_INTERACTIONS_TABLE = process.env.USER_INTERACTIONS_TABLE || 'UserInteractions';

/**
 * Gets the message order for a new message in a chat
 * This function queries the UserInteractions table to find the highest message order
 * for a given chatId, then returns the next number in sequence.
 *
 * @param {string} chatId - The chat ID to query
 * @returns {Promise<number>} - The next message order (count + 1)
 */
const getNextMessageOrder = async (chatId) => {
  if (!chatId) {
    console.error('CRITICAL ERROR: Attempted to get message order with null or undefined chatId');
    return 1; // Default to 1 as fallback, but this should never happen
  }

  try {
    console.log(`Getting next message order for chatId: ${chatId}`);

    // First try using the GSI for efficient querying
    try {
      const queryParams = {
        TableName: USER_INTERACTIONS_TABLE,
        IndexName: 'chatId-timestamp-index',
        KeyConditionExpression: 'chatId = :chatId',
        ExpressionAttributeValues: {
          ':chatId': chatId
        },
        Select: 'COUNT'
      };

      const result = await docClient.send(new QueryCommand(queryParams));
      const messageOrder = (result.Count || 0) + 1;
      console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via GSI)`);
      return messageOrder;
    } catch (gsiError) {
      // If the primary GSI fails, try an alternative approach
      console.warn(`GSI query failed for chatId ${chatId}: ${gsiError.message}. Trying alternative approach...`);

      try {
        // Try a different index if available
        const altQueryParams = {
          TableName: USER_INTERACTIONS_TABLE,
          IndexName: 'chatId-index', // Try alternative index name
          KeyConditionExpression: 'chatId = :chatId',
          ExpressionAttributeValues: {
            ':chatId': chatId
          }
        };

        const altResult = await docClient.send(new QueryCommand(altQueryParams));
        const messageOrder = (altResult.Items?.length || 0) + 1;
        console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via alternative GSI)`);
        return messageOrder;
      } catch (altError) {
        // If all GSI approaches fail, try a scan as last resort
        console.warn(`Alternative GSI query failed for chatId ${chatId}: ${altError.message}. Trying scan fallback...`);

        try {
          // Last resort: scan the table with a filter (less efficient but works as backup)
          const scanParams = {
            TableName: USER_INTERACTIONS_TABLE,
            FilterExpression: 'chatId = :chatId',
            ExpressionAttributeValues: {
              ':chatId': chatId
            }
          };

          const scanResult = await docClient.send(new ScanCommand(scanParams));
          const messageOrder = (scanResult.Items?.length || 0) + 1;
          console.log(`Next message order for chatId ${chatId}: ${messageOrder} (via table scan - less efficient)`);
          return messageOrder;
        } catch (scanError) {
          console.error(`All methods to get message order for chatId ${chatId} failed:`, scanError);
          throw scanError; // Pass to outer catch block
        }
      }
    }
  } catch (error) {
    console.error(`Error getting message order for chatId ${chatId}:`, error);
    console.log(`Defaulting to message order 1 for chatId ${chatId}`);
    // Default to 1 if there's an error (e.g., if the GSI doesn't exist yet)
    return 1;
  }
};

/**
 * Records a user interaction in the UserInteractions DynamoDB table
 *
 * This function stores user interactions with consistent chat context:
 * - Uses chatId to group related messages in the same conversation
 * - Maintains messageOrder to preserve the sequence of messages
 * - Links interactions to sessions for user context persistence
 *
 * @param {Object} params - Parameters for the interaction
 * @param {string} params.userId - User ID
 * @param {string} params.sessionId - Session ID
 * @param {string} params.chatId - Chat ID for grouping messages in the same conversation
 * @param {string} params.chatSessionId - Chat Session ID for grouping all messages in a single chat session
 * @param {number} params.messageOrder - Order of the message in the chat (sequential)
 * @param {string} params.query - User's query/prompt
 * @param {string} [params.response] - System response (if available)
 * @param {boolean} [params.isDocumentAnalysis] - Whether this is a document analysis interaction
 * @param {Object} [params.metadata] - Additional metadata about the interaction
 * @returns {Promise<Object>} - The result of the DynamoDB put operation
 */
const recordUserInteraction = async (params) => {
  try {
    const { userId, sessionId, chatId, chatSessionId, messageOrder, query, response, isDocumentAnalysis, metadata = {} } = params;

    const item = {
      userId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      sessionId,
      chatId,
      chatSessionId,
      messageOrder,
      query,
      response: response || null,
      isDocumentAnalysis: !!isDocumentAnalysis,
      voteUp: 0,
      voteDown: 0,
      feedback: null,
      ...metadata
    };

    console.log('Recording user interaction:', JSON.stringify(item, null, 2));

    const result = await docClient.send(new PutCommand({
      TableName: USER_INTERACTIONS_TABLE,
      Item: item
    }));

    console.log('User interaction recorded successfully');
    return result;
  } catch (error) {
    console.error('Error recording user interaction:', error);
    // Don't throw the error to prevent blocking the main flow
    return null;
  }
};

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

  console.log('Request received(Testing):', JSON.stringify(req.body, null, 2)); // Log the request body

  try {
    // Ensure CORS headers are set for this response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    const prompt = req.body.message;
    let sessionId = req.body.sessionId || `session-${Date.now()}`;
    const userId = req.body.userId || 'test-user';

    // Extract chatSessionId from request body - for tracking entire chat sessions
    const chatSessionId = req.body.chatSessionId || `chat-session-${Date.now()}`;

    // Extract chatId from request body - CRITICAL for conversation continuity
    const providedChatId = req.body.chatId;

    // Log warning if chatId is missing - this helps diagnose frontend issues
    if (!providedChatId) {
      console.warn('WARNING: No chatId provided in request. This may cause conversation fragmentation.');
      console.warn('Request details:', {
        path: req.path,
        userId,
        sessionId,
        hasMessage: !!prompt,
        timestamp: new Date().toISOString()
      });
    }

    // Always use the provided chatId, only generate as last resort
    const chatId = providedChatId || `chat-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const requestId = uuidv4();

    console.log('Processing message:', prompt);
    console.log('Session ID:', sessionId);
    console.log('Chat ID:', chatId, providedChatId ? '(from request)' : '(NEWLY GENERATED - conversation continuity at risk)');
    console.log('Chat Session ID:', chatSessionId);
    console.log('User ID:', userId);

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
        userId,
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
          userId,
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

      // Get the next message order for this chat - using the persistent chatId
      const messageOrder = await getNextMessageOrder(chatId);
      console.log(`Determined message order: ${messageOrder} for document analysis with chatId: ${chatId}`);

      // Record the user interaction with the persistent chatId
      await recordUserInteraction({
        userId,
        sessionId,
        chatId,
        chatSessionId,
        messageOrder,
        query: prompt,
        isDocumentAnalysis: true,
        metadata: {
          requestId,
          status: 'QUEUED',
          fileCount: s3FileInfos.length,
          providedChatId: !!providedChatId // Track if chatId was provided for diagnostics
        }
      });

      console.log(`Recorded document analysis request with chatId: ${chatId}, messageOrder: ${messageOrder}`);

      // Include chatId in the response for client reference

      // Return immediate response with request ID and chatId
      return res.json({
        requestId,
        status: 'QUEUED',
        message: 'Your document is being analyzed. Please check the status endpoint for updates.',
        timestamp: new Date().toISOString(),
        progress: 0,
        chatId: chatId, // Include chatId in the response for client reference
        chatSessionId: chatSessionId, // Include chatSessionId in the response for client reference
        messageOrder: messageOrder // Include messageOrder in the response for client reference
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
        region: process.env.AWS_REGION || 'us-east-1',
        userId: userId
      });

      // Use the session ID from the response if available
      const finalSessionId = response.sessionId || sessionId;

      // CRITICAL: We must use the same chatId that was extracted earlier in the request
      // This ensures conversation continuity in the database
      console.log(`Using persistent chatId for message ordering: ${chatId}`);

      // Get the next message order for this chat
      const messageOrder = await getNextMessageOrder(chatId);
      console.log(`Determined message order: ${messageOrder} for chatId: ${chatId}`);

      // Record the user interaction with the persistent chatId
      await recordUserInteraction({
        userId,
        sessionId: finalSessionId,
        chatId: chatId, // Use the persistent chatId, not generating a new one
        chatSessionId, // Include the chat session ID for grouping all messages in a session
        messageOrder,
        query: prompt,
        response: response.completion,
        isDocumentAnalysis: false,
        metadata: {
          hasAttachments: binaryFiles.length > 0 || s3FileInfos.length > 0,
          providedChatId: !!providedChatId // Track if chatId was provided for diagnostics
        }
      });

      console.log(`Recorded chat message with chatId: ${chatId}, messageOrder: ${messageOrder}`);

      return res.json({
        message: response.completion,
        sessionId: response.sessionId,
        chatId: chatId, // Return the persistent chatId in the response for client reference
        chatSessionId: chatSessionId, // Return the chat session ID in the response for client reference
        messageOrder: messageOrder, // Return the message order for client reference
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
