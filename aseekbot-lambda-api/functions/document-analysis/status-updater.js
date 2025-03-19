const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  // Log the full input event with detailed formatting
  console.log('Updating document status:', JSON.stringify(event, null, 2));

  try {
    // Extract all relevant information from the event
    const {
      documentId,
      userId,
      status,
      message,
      resultLocation,
      s3Bucket,
      s3Key,
      fileType
    } = event;

    // TODO: Update status in DynamoDB
    await dynamoDB.put({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: {
        documentId,
        userId,
        status,
        message,
        resultLocation,
        s3Bucket,
        s3Key,
        fileType,
        timestamp: new Date().toISOString()
      }
    }).promise();

    console.log(`Status updated for document ${documentId}: ${status}`);

    // Return the entire original event to preserve all context
    return event;
  } catch (error) {
    console.error('Error updating status:', error);

    // Rethrow the error to allow Step Functions to handle it
    throw error;
  }
};