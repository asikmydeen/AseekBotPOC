// functions/document-analysis/textract-pdf.js
const AWS = require('aws-sdk');
const textract = new AWS.Textract();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Extracting PDF text', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId } = event;

  try {
    // Start document text detection
    const startResponse = await textract.startDocumentTextDetection({
      DocumentLocation: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key
        }
      }
    }).promise();

    const jobId = startResponse.JobId;

    // For testing, we'll simulate the job completing instantly
    // In production, you would use a Step Functions Wait state or another mechanism to check job status

    return {
      ...event,
      extractedText: `This is simulated text extracted from PDF document ${s3Key} in bucket ${s3Bucket}. JobId: ${jobId}`,
      textExtractionMethod: 'textract'
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
};