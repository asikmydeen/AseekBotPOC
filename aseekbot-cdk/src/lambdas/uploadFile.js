const serverless = require('serverless-http');
const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { handleApiError } = require('../utils/apiErrorHandler');

const app = express();
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

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
});

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Add debugging middleware
app.use((req, res, next) => {
  console.log('Request received:');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Path:', req.path);
  next();
});

// Use wildcard path with multer middleware
app.post('*', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const userId = req.body.userId || 'test-user';

    const file = req.file;
    const fileName = file.originalname;
    const fileType = file.mimetype;
    const fileSize = file.size;

    console.log(`Processing upload for file: ${fileName}, type: ${fileType}, size: ${fileSize} bytes, sessionId: ${sessionId}, userId: ${userId}`);

    // Create a sanitized filename and unique S3 key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const s3Key = `uploads/${userId}/${timestamp}_${sanitizedFileName}`;

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error('AWS_S3_BUCKET_NAME environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Upload file to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: s3Key,
      Body: file.buffer,
      ContentType: fileType
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Record file upload in DynamoDB
    try {
      const userFilesTable = process.env.USER_FILES_TABLE;
      if (!userFilesTable) {
        console.warn('USER_FILES_TABLE environment variable is not set, skipping DB record');
      } else {
        const uploadDate = new Date().toISOString();
        const fileRecord = {
          userId: userId,
          fileKey: s3Key,
          fileName: fileName,
          fileSize: fileSize,
          fileType: fileType,
          uploadDate: uploadDate
        };

        const putParams = {
          TableName: userFilesTable,
          Item: fileRecord
        };

        const putCommand = new PutCommand(putParams);
        await docClient.send(putCommand);
        console.log(`File record saved to DynamoDB: ${JSON.stringify(fileRecord)}`);
      }
    } catch (dbError) {
      // Log error but don't fail the request
      console.error('Error saving file record to DynamoDB:', dbError);
      // Continue processing to return success response for the upload
    }

    // Construct the S3 URL
    const region = 'us-east-1';
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

    // Return success response with the file URL
    return res.json({
      success: true,
      fileUrl: fileUrl,
      fileName: fileName,
      fileType: fileType,
      fileSize: fileSize
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
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
