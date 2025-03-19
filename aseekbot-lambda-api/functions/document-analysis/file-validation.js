// functions/document-analysis/file-validation.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Validating file', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, fileType, documentId } = event;

  try {
    // Check if file exists in S3
    const headObject = await s3.headObject({
      Bucket: s3Bucket,
      Key: s3Key
    }).promise();

    const fileSizeBytes = headObject.ContentLength;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    // Validate file size
    if (fileSizeBytes > maxSizeBytes) {
      throw new Error(`File size exceeds maximum allowed (${fileSizeBytes} > ${maxSizeBytes})`);
    }

    // Validate file type
    const validTypes = ['pdf', 'docx', 'xlsx', 'csv', 'txt'];
    if (!validTypes.includes(fileType.toLowerCase())) {
      throw new Error(`File type ${fileType} is not supported. Supported types: ${validTypes.join(', ')}`);
    }

    return {
      ...event,
      fileSizeBytes,
      contentType: headObject.ContentType,
      validationResult: {
        isValid: true,
        message: 'File validation successful'
      }
    };

  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};