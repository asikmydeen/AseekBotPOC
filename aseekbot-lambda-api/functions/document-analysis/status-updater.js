// functions/document-analysis/status-updater.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client();

async function getDataFromS3(s3Bucket, s3Key) {
  try {
    const command = new GetObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key
    });

    const response = await s3Client.send(command);

    // Convert readable stream to text
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const text = buffer.toString('utf-8');

    return JSON.parse(text);
  } catch (error) {
    console.error(`Error getting data from S3: ${error.message}`);
    throw error;
  }
}

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

    // If we have an S3 reference to excelParsingResults that were stored separately,
    // reintegrate that data here
    if (event.excelParsingResults && event.excelParsingResults.s3Reference) {
      try {
        console.log('Found S3 reference to Excel parsing results, retrieving data...');
        const ref = event.excelParsingResults.s3Reference;

        // Store S3 reference information in DynamoDB for future retrieval
        item.excelParsingResultsLocation = {
          s3Bucket: ref.s3Bucket,
          s3Key: ref.s3Key,
          timestamp: ref.timestamp
        };

        // Do not try to fetch the data here since we don't need it for the status update
        // Just add a note to the status
        if (item.message) {
          item.message += `. Excel data stored in S3 (${ref.s3Key})`;
        } else {
          item.message = `Excel data stored in S3 (${ref.s3Key})`;
        }
      } catch (s3Error) {
        console.error('Error processing S3 reference:', s3Error);
        // Continue without the S3 data if there's an error
      }
    }

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