// functions/document-analysis/textract-pdf.js
const AWS = require('aws-sdk');
const textract = new AWS.Textract();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Extracting PDF text using Textract', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId } = event;

  try {
    // For smaller PDFs (<5MB), we can use the synchronous DetectDocumentText API
    // Get the S3 object
    const s3Response = await s3.getObject({
      Bucket: s3Bucket,
      Key: s3Key
    }).promise();

    // Check the file size
    const fileSize = s3Response.ContentLength;
    console.log(`PDF file size: ${fileSize} bytes`);

    let extractedText = '';

    // For small files (<5MB), use synchronous DetectDocumentText
    if (fileSize < 5 * 1024 * 1024) {
      console.log('Using synchronous DetectDocumentText API for small file');

      const textractResponse = await textract.detectDocumentText({
        Document: {
          Bytes: s3Response.Body
        }
      }).promise();

      // Extract text from the response
      if (textractResponse.Blocks) {
        textractResponse.Blocks.forEach(block => {
          if (block.BlockType === 'LINE') {
            extractedText += block.Text + '\n';
          }
        });
      }
    }
    // For larger files, use the asynchronous StartDocumentTextDetection API
    else {
      console.log('Using asynchronous StartDocumentTextDetection API for larger file');

      // Start the text detection job
      const startResponse = await textract.startDocumentTextDetection({
        DocumentLocation: {
          S3Object: {
            Bucket: s3Bucket,
            Name: s3Key
          }
        }
      }).promise();

      const jobId = startResponse.JobId;
      console.log(`Started Textract job with ID: ${jobId}`);

      // Wait for the job to complete with exponential backoff
      let result = null;
      let status = 'IN_PROGRESS';

      while (status === 'IN_PROGRESS') {
        // Wait for a few seconds before checking status
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the job status
        const jobResponse = await textract.getDocumentTextDetection({
          JobId: jobId
        }).promise();

        status = jobResponse.JobStatus;
        console.log(`Job status: ${status}`);

        if (status === 'SUCCEEDED') {
          result = jobResponse;

          // Collect text from all pages
          const blocks = result.Blocks || [];
          blocks.forEach(block => {
            if (block.BlockType === 'LINE') {
              extractedText += block.Text + '\n';
            }
          });

          // Handle pagination if there are more pages of results
          let nextToken = result.NextToken;
          while (nextToken) {
            const moreResults = await textract.getDocumentTextDetection({
              JobId: jobId,
              NextToken: nextToken
            }).promise();

            const moreBlocks = moreResults.Blocks || [];
            moreBlocks.forEach(block => {
              if (block.BlockType === 'LINE') {
                extractedText += block.Text + '\n';
              }
            });

            nextToken = moreResults.NextToken;
          }
        } else if (status === 'FAILED') {
          throw new Error(`Textract job failed: ${jobResponse.StatusMessage || 'Unknown error'}`);
        }
      }
    }

    // If we didn't get any text, provide a meaningful message
    if (!extractedText.trim()) {
      extractedText = "No text content was extracted from the PDF. The document might be scanned as images or protected.";
    }

    console.log('Successfully extracted text from PDF');
    console.log(`Text length: ${extractedText.length} characters`);

    // Return the extracted text along with metadata
    return {
      ...event,
      extractedText,
      textExtractionMethod: 'textract',
      extractionDetails: {
        fileSize,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);

    // Return a fallback so the workflow can continue
    return {
      ...event,
      extractedText: `Error extracting text from PDF: ${error.message}. Please check the PDF file format and contents.`,
      textExtractionMethod: 'error',
      extractionError: error.message
    };
  }
};