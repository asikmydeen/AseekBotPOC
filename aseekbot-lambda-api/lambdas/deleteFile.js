const serverless = require('serverless-http');
const express = require('express');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();
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

const s3Client = new S3Client({
  region: 'us-east-1',
});

const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Function to check if file belongs to user
async function checkFileOwnership(userId, s3Key) {
  if (!userId) {
    return false;
  }

  try {
    const command = new QueryCommand({
      TableName: 'UserFiles',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 's3Key = :s3Key',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':s3Key': s3Key
      }
    });

    const response = await docClient.send(command);
    return response.Items && response.Items.length > 0;
  } catch (error) {
    console.error('Error checking file ownership:', error);
    return false;
  }
}

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Path:', req.path);
  console.log('- Body:', JSON.stringify(req.body));
  next();
});

app.post('*', async (req, res) => {
  try {
    const { s3Key, userId } = req.body;
    if (!s3Key) {
      return res.status(400).json({ error: 'No S3 key provided' });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error('AWS_S3_BUCKET_NAME environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // If userId is provided, validate file ownership
    if (userId) {
      const isOwner = await checkFileOwnership(userId, s3Key);
      if (!isOwner) {
        return res.status(403).json({
          error: 'Unauthorized',
          message: 'You do not have permission to delete this file'
        });
      }
    }

    const deleteParams = { Bucket: bucketName, Key: s3Key };
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    const errorResponse = handleApiError(error);
    return res.status(errorResponse.status || 500).json(errorResponse.body);
  }
});

// Add catch-all handler for other request methods
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

module.exports.handler = serverless(app);
