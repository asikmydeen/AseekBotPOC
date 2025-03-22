// functions/document-analysis/error-handler.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Handling error', JSON.stringify(event, null, 2));

  const { error, documentId, errorType } = event;

  try {
    // Log error to CloudWatch
    console.error(`Error in document analysis (${errorType}):`, error);

    // Record error in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: {
        documentId,
        status: 'ERROR',
        errorType,
        errorMessage: error.message || JSON.stringify(error),
        timestamp: new Date().toISOString()
      }
    }));

    return {
      ...event,
      error: {
        type: errorType,
        message: error.message || JSON.stringify(error),
        timestamp: new Date().toISOString()
      }
    };
  } catch (secondaryError) {
    console.error('Error in error handler:', secondaryError);
    return {
      ...event,
      error: {
        type: 'ErrorHandlerFailed',
        originalError: error,
        secondaryError: secondaryError.message
      }
    };
  }
};