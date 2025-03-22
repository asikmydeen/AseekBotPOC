/**
 * Lambda function for generating S3 presigned URLs for file downloads
 *
 * Expected request format:
 * - GET: /files/download?fileKey=path/to/file.ext
 * - POST: { "fileKey": "path/to/file.ext" }
 *
 * Response format:
 * - Success: { "url": "https://s3-presigned-url..." }
 * - Error: { "statusCode": 400, "message": "Error message" }
 *
 * Client should extract the 'url' property from the response and use it directly
 * without any additional processing or wrapping.
 */
const express = require('express');
const serverless = require('serverless-http');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize Express app
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  next();
});

// Parse JSON bodies
app.use(express.json());

// Handle both GET and POST requests for file downloads
app.all('/files/download', async (req, res) => {
  console.log('Download file request received:', {
    body: req.body,
    headers: req.headers,
    path: req.path,
    method: req.method
  });

  try {
    // Extract fileKey from request body or query parameters
    let fileKey;

    if (req.method === 'GET') {
      // Support for GET requests with query parameters
      fileKey = req.query.fileKey;
    } else {
      // Parse request body for POST requests
      fileKey = req.body.fileKey;
    }

    // Validate fileKey parameter
    if (!fileKey) {
      console.log('Missing fileKey parameter');
      return res.status(400).json({
        statusCode: 400,
        message: 'Missing required parameter: fileKey'
      });
    }

    // Get bucket name from environment variable
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.log('S3 bucket name not configured in environment variables');
      return res.status(500).json({
        statusCode: 500,
        message: 'S3 bucket name is not configured'
      });
    }

    // Validate that the key is not empty
    if (!fileKey.trim()) {
      console.log('fileKey is empty');
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid fileKey: Empty key'
      });
    }

    console.log(`Attempting to generate pre-signed URL for bucket: ${bucketName}, key: ${fileKey}`);

    // Initialize S3 client with explicit region from environment or default to us-east-1
    const region = process.env.AWS_REGION || 'us-east-1';
    console.log(`Using AWS region: ${region}`);
    const s3Client = new S3Client({ region });

    // Create command to get the object
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    });

    // Generate pre-signed URL with 5-minute expiration
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Log the raw presigned URL for debugging
    console.log('Successfully generated pre-signed URL:', signedUrl);

    // Return only the pre-signed URL in the response
    // Note: The URL is returned as a string property in a JSON object
    // Client should extract the 'url' property from the response
    return res.status(200).json({
      url: signedUrl
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Check for specific S3 errors
    let statusCode = 500;
    let message = 'Failed to generate download URL';

    if (error.name === 'NoSuchKey') {
      statusCode = 404;
      message = 'File not found in S3 bucket';
    } else if (error.name === 'AccessDenied') {
      statusCode = 403;
      message = 'Access denied to the requested file';
    } else if (error.name === 'SignatureDoesNotMatch') {
      statusCode = 403;
      message = 'Signature validation failed';
    }

    return res.status(statusCode).json({
      statusCode,
      message,
      error: error.message
    });
  }
});

// Fallback route for any other paths
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: 'Not Found'
  });
});

// Export the serverless handler
module.exports.handler = serverless(app);
