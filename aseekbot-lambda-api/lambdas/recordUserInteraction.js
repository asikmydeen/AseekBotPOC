const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Initialize DynamoDB document client
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'UserInteractions';

/**
 * Lambda function to record user interactions in DynamoDB
 * @param {Object} event - Lambda event object containing interaction details
 * @returns {Object} - Response object with status code and message
 */
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract data from the event
    const { userId, query, response, feedback } = JSON.parse(event.body || '{}');
    
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
      feedback: feedback || null
    };
    
    // Write to DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    
    await dynamoDB.put(params).promise();
    
    console.log('Successfully recorded user interaction:', interactionId);
    
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