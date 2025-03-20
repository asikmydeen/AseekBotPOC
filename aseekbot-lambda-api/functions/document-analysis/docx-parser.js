// functions/document-analysis/docx-parser.js
const AWS = require('aws-sdk');
const mammoth = require('mammoth');
const s3 = new AWS.S3();

/**
 * Downloads a DOCX file from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - File buffer
 */
async function downloadDocxFile(bucket, key) {
  console.log(`Downloading DOCX file from s3://${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key
  };

  const response = await s3.getObject(params).promise();
  return response.Body;
}

/**
 * Extracts text from a DOCX file buffer
 * @param {Buffer} fileBuffer - DOCX file buffer
 * @param {string} useCase - Use case for text extraction (defaults to 'general')
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromDocx(fileBuffer, useCase = 'general') {
  console.log(`Extracting text from DOCX file for use case: ${useCase}`);

  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return result.value;
}

exports.handler = async (event) => {
  console.log('Extracting DOCX text', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, useCase = 'general' } = event;

  try {
    // Download the file from S3
    const fileBuffer = await downloadDocxFile(s3Bucket, s3Key);

    // Extract text from the DOCX file
    const extractedText = await extractTextFromDocx(fileBuffer, useCase);

    return {
      ...event,
      extractedText,
      textExtractionMethod: 'docx-parser'
    };
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return {
      ...event,
      error: {
        message: error.message,
        stack: error.stack
      },
      textExtractionMethod: 'docx-parser-error'
    };
  }
};
