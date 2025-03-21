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
      message: message || `Status updated to ${status}`,
      timestamp: new Date().toISOString()
    };

    // Add optional fields if they exist
    if (resultLocation) item.resultLocation = resultLocation;

    // Store insights if available
    if (event.insights) {
      console.log('Insights data found:', JSON.stringify(event.insights, null, 2));
      item.insights = event.insights;
    } else {
      console.log('No insights data found in the event');
    }

    // Save original input fields that need to be preserved
    if (event.s3Bucket) item.s3Bucket = event.s3Bucket;
    if (event.s3Key) item.s3Key = event.s3Key;
    if (event.fileType) item.fileType = event.fileType;

    // Store S3 reference information in a compact format
    if (event.excelParsingResults) {
      const refs = [];

      if (event.excelParsingResults.fullDataRef) {
        refs.push({
          type: 'fullData',
          s3Key: event.excelParsingResults.fullDataRef.s3Key
        });
      }

      if (event.excelParsingResults.procurementDataRef) {
        refs.push({
          type: 'procurementData',
          s3Key: event.excelParsingResults.procurementDataRef.s3Key
        });
      }

      if (refs.length > 0) {
        item.dataReferences = refs;

        // Add a note to the status message
        if (item.message) {
          item.message += `. Data stored in S3 (${refs.length} references)`;
        } else {
          item.message = `Data stored in S3 (${refs.length} references)`;
        }
      }
    }

    // Update status in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: item
    }));

    console.log(`Status updated for document ${documentId}: ${status}`);

    // Filter out large properties to avoid Step Functions payload limit
    // This creates a copy of the event without circular references
    const filteredEvent = JSON.parse(JSON.stringify(event));

    // Return a compact version of the event to avoid payload size issues
    return filteredEvent;
  } catch (error) {
    console.error('Error updating status:', error);

    // Return a simplified error response
    return {
      ...event,
      statusUpdateError: {
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};
