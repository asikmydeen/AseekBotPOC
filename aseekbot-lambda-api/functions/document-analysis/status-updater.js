// functions/document-analysis/status-updater.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Updating document status:', JSON.stringify(event, null, 2));

  try {
    // Extract status update information
    const {
      documentId,
      userId,
      status,
      message,
      resultLocation,
    } = event;

    // Create item to save in DynamoDB
    const item = {
      documentId,
      userId,
      status,
      message,
      timestamp: new Date().toISOString()
    };

    // Add optional fields if they exist
    if (resultLocation) item.resultLocation = resultLocation;

    // Save original input fields that need to be preserved
    if (event.s3Bucket) item.s3Bucket = event.s3Bucket;
    if (event.s3Key) item.s3Key = event.s3Key;
    if (event.fileType) item.fileType = event.fileType;

    // Update status in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: item
    }));

    console.log(`Status updated for document ${documentId}: ${status}`);

    // IMPORTANT: Return the complete input with all the original fields
    // This ensures the next state has access to all required fields
    return event;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};