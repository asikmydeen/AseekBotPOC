const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Initialize client
const s3Client = new S3Client();

exports.handler = async (event) => {
  console.log('Validating file', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, fileType, documentId } = event;

  try {
    // Check if file exists in S3
    const headObjectCommand = new HeadObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key
    });

    const headObject = await s3Client.send(headObjectCommand);

    const fileSizeBytes = headObject.ContentLength;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    // Validate file size
    if (fileSizeBytes > maxSizeBytes) {
      throw new Error(`File size exceeds maximum allowed (${fileSizeBytes} > ${maxSizeBytes})`);
    }

    // Extract content type and determine actual file type
    const contentType = headObject.ContentType || '';
    let detectedFileType = fileType.toLowerCase();

    // Override fileType based on content-type if possible
    if (contentType.includes('pdf')) {
      detectedFileType = 'pdf';
    } else if (contentType.includes('tiff') || contentType.includes('image/tiff')) {
      detectedFileType = 'tiff';
    } else if (contentType.includes('jpeg') || contentType.includes('jpg') || contentType.includes('image/jpeg')) {
      detectedFileType = 'jpeg';
    } else if (contentType.includes('png') || contentType.includes('image/png')) {
      detectedFileType = 'png';
    } else if (contentType.includes('word') || contentType.includes('docx')) {
      detectedFileType = 'docx';
    } else if (contentType.includes('excel') || contentType.includes('xlsx') || contentType.includes('spreadsheet')) {
      detectedFileType = 'xlsx';
    } else if (contentType.includes('csv')) {
      detectedFileType = 'csv';
    }

    // Validate file type
    const textractTypes = ['pdf', 'tiff', 'jpeg', 'jpg', 'png'];
    const officeTypes = ['docx', 'xlsx', 'csv', 'txt'];
    const validTypes = [...textractTypes, ...officeTypes];

    if (!validTypes.includes(detectedFileType)) {
      throw new Error(`File type ${detectedFileType} is not supported. Supported types: ${validTypes.join(', ')}`);
    }

    return {
      ...event,
      fileType: detectedFileType,
      fileSizeBytes,
      contentType: headObject.ContentType,
      validationResult: {
        isValid: true,
        message: 'File validation successful',
        isTextractSupported: textractTypes.includes(detectedFileType)
      }
    };

  } catch (error) {
    console.error('Validation error:', error);
    throw error;
  }
};