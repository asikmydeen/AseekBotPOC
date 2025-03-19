exports.handler = async (event) => {
  console.log('Updating document status', event);

  const { documentId, userId, status, message } = event;

  // Add your code to update status in DynamoDB
  // const AWS = require('aws-sdk');
  // const dynamoDB = new AWS.DynamoDB.DocumentClient();
  // await dynamoDB.put({
  //   TableName: process.env.STATUS_TABLE,
  //   Item: {
  //     documentId,
  //     userId,
  //     status,
  //     message,
  //     timestamp: new Date().toISOString()
  //   }
  // }).promise();

  return event;
};// functions/document-analysis/status-updater.js
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('Updating document status', JSON.stringify(event, null, 2));

  const { documentId, userId, status, message, resultLocation } = event;

  try {
    await dynamoDB.put({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: {
        documentId,
        userId,
        status,
        message,
        resultLocation,
        timestamp: new Date().toISOString()
      }
    }).promise();

    console.log(`Status updated for document ${documentId}: ${status}`);
    return event;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};