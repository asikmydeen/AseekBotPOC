const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Environment variables
const USER_FILES_TABLE = process.env.USER_FILES_TABLE || 'UserFiles';
const S3_BUCKET = process.env.S3_BUCKET || 'aseekbot-files';
const URL_EXPIRATION = process.env.URL_EXPIRATION || 3600; // Default 1 hour

/**
 * Lambda function to get files for a specific user
 */
exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));

    // Extract userId from the event
    const userId = event.queryStringParameters?.userId ||
                   event.pathParameters?.userId ||
                   JSON.parse(event.body || '{}').userId;

    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // Query DynamoDB for files belonging to the user
    const params = {
      TableName: USER_FILES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const result = await dynamodb.query(params).promise();

    // Generate presigned URLs for each file
    const files = await Promise.all(result.Items.map(async (file) => {
      const presignedUrl = await s3.getSignedUrlPromise('getObject', {
        Bucket: S3_BUCKET,
        Key: file.fileKey,
        Expires: parseInt(URL_EXPIRATION)
      });

      return {
        fileId: file.fileId,
        fileName: file.fileName,
        fileKey: file.fileKey,
        uploadDate: file.uploadDate,
        fileSize: file.fileSize,
        fileType: file.fileType,
        presignedUrl
      };
    }));

    // Return the response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        data: files,
        url: "",
        chatId: "getUserFiles-success"
      })
    };

  } catch (error) {
    console.error('Error retrieving user files:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Failed to retrieve user files',
        message: error.message
      })
    };
  }
};
