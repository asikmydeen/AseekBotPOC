const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize DynamoDB document client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'UserInteractions';

/**
 * Lambda function to record user interactions in DynamoDB
 * @param {Object} event - Lambda event object containing interaction details
 *                         including userId, query, response, feedback, chatId, and messageOrder
 * @returns {Object} - Response object with status code and message
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract data from the event
    const { userId, query, response, feedback, chatId, messageOrder, chatSessionId } = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!userId) {
      console.error('Missing required field: userId');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ message: 'Missing required field: userId' })
      };
    }

    // Generate a unique interaction ID
    const interactionId = uuidv4();
    const timestamp = new Date().toISOString();

    // Prepare the item for DynamoDB
    const item = {
      interactionId,
      userId,
      timestamp,
      query: query || null,
      response: response || null,
      feedback: feedback || null,
      chatId: chatId || null,       // Chat session identifier for grouping related interactions
      messageOrder: messageOrder || null,  // Order of messages within a chat session
      chatSessionId: chatSessionId || null // Identifier for tracking the entire conversation session across messages
    };

    // Write to DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };

    await dynamoDB.put(params).promise();

    console.log('Successfully recorded user interaction:', interactionId, 'for chat:', chatId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'User interaction recorded successfully',
        interactionId
      })
    };

  } catch (error) {
    console.error('Error recording user interaction:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Error recording user interaction',
        error: error.message
      })
    };
  }
};
