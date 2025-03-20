// functions/document-analysis/textract-pdf.js - Using AWS SDK v3
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand
} = require("@aws-sdk/client-textract");

// Create clients
const region = process.env.AWS_REGION || 'us-east-1';
const s3Client = new S3Client({ region });
const textractClient = new TextractClient({ region });

exports.handler = async (event) => {
  console.log('Extracting PDF text using Textract', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId } = event;
  let s3Response = null;
  let fileSize = 0;
  let extractedText = '';

  try {
    // Get the S3 object metadata
    s3Response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key
      })
    );

    // Check the file size
    fileSize = s3Response.ContentLength;
    console.log(`PDF file size: ${fileSize} bytes`);

    // For small files (<5MB), use synchronous DetectDocumentText
    if (fileSize < 5 * 1024 * 1024) {
      console.log('Using synchronous DetectDocumentText API for small file');

      try {
        // Get the file content
        const fileContent = await s3Client.send(
          new GetObjectCommand({
            Bucket: s3Bucket,
            Key: s3Key
          })
        );

        // Convert the readable stream to a buffer
        const chunks = [];
        for await (const chunk of fileContent.Body) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Use the DetectDocumentText API which inherently includes OCR
        const textractResponse = await textractClient.send(
          new DetectDocumentTextCommand({
            Document: {
              Bytes: buffer
            }
          })
        );

        // Extract text from the response
        if (textractResponse.Blocks) {
          console.log(`Detected ${textractResponse.Blocks.length} blocks`);

          for (const block of textractResponse.Blocks) {
            if (block.BlockType === 'LINE') {
              extractedText += block.Text + '\n';
            }
          }

          console.log(`Extracted ${extractedText.length} characters using synchronous API`);
        }
      } catch (syncError) {
        console.log('Synchronous extraction failed:', syncError.message);
        // If synchronous method fails, we'll continue to asynchronous method
      }
    }

    // For larger files or if synchronous method failed, use asynchronous method
    if (extractedText.length === 0) {
      console.log('Using asynchronous StartDocumentTextDetection API');

      // Start the asynchronous text detection job
      const startResponse = await textractClient.send(
        new StartDocumentTextDetectionCommand({
          DocumentLocation: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3Key
            }
          }
        })
      );

      const jobId = startResponse.JobId;
      console.log(`Started Textract job with ID: ${jobId}`);

      // Poll for completion with exponential backoff
      let jobResult;
      let jobStatus = 'IN_PROGRESS';
      let retries = 0;
      const maxRetries = 24; // Maximum 2 minutes wait (with exponential backoff)

      while (jobStatus === 'IN_PROGRESS' && retries < maxRetries) {
        // Wait based on retry count (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000); // Wait between 1s and 10s
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Get the job status
        const getResponse = await textractClient.send(
          new GetDocumentTextDetectionCommand({
            JobId: jobId
          })
        );

        jobStatus = getResponse.JobStatus;
        console.log(`Job status after ${retries + 1} checks: ${jobStatus}`);

        if (jobStatus === 'SUCCEEDED') {
          jobResult = getResponse;
          break;
        } else if (jobStatus === 'FAILED') {
          throw new Error(`Textract job failed: ${getResponse.StatusMessage || 'Unknown error'}`);
        }

        retries++;
      }

      if (jobStatus === 'IN_PROGRESS') {
        throw new Error('Textract job timed out - still in progress after maximum wait time');
      }

      // Process results and handle pagination
      if (jobResult.Blocks) {
        console.log(`Processing ${jobResult.Blocks.length} blocks from async job result`);

        // Extract text from the blocks
        for (const block of jobResult.Blocks) {
          if (block.BlockType === 'LINE') {
            extractedText += block.Text + '\n';
          }
        }

        // Handle pagination if there are more results
        let nextToken = jobResult.NextToken;
        while (nextToken) {
          console.log('Fetching additional result pages');

          const pageResponse = await textractClient.send(
            new GetDocumentTextDetectionCommand({
              JobId: jobId,
              NextToken: nextToken
            })
          );

          if (pageResponse.Blocks) {
            for (const block of pageResponse.Blocks) {
              if (block.BlockType === 'LINE') {
                extractedText += block.Text + '\n';
              }
            }
          }

          nextToken = pageResponse.NextToken;
        }

        console.log(`Extracted ${extractedText.length} characters using asynchronous API`);
      }
    }

    // If we didn't get any text, provide a meaningful message
    if (!extractedText.trim()) {
      console.log('No text was extracted from the document even with OCR');

      return {
        ...event,
        extractedText: "No text content was extracted from the PDF even with OCR. The document might have image quality issues, unusual fonts, or special protection.",
        textExtractionMethod: "textract-empty-result",
        extractionDetails: {
          fileSize,
          timestamp: new Date().toISOString()
        }
      };
    }

    console.log('Successfully extracted text from PDF');

    // Return the extracted text along with metadata
    return {
      ...event,
      extractedText,
      textExtractionMethod: 'textract',
      extractionDetails: {
        fileSize,
        timestamp: new Date().toISOString(),
        characterCount: extractedText.length,
        lineCount: extractedText.split('\n').length
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);

    // Create a fallback extraction result to keep the workflow going
    return {
      ...event,
      extractedText: `This document (${s3Key.split('/').pop()}) could not be processed due to: ${error.message}. The step functions workflow will continue with limited information.`,
      textExtractionMethod: 'error-with-fallback',
      extractionError: error.message,
      extractionDetails: {
        errorCode: error.Code || error.code || 'unknown',
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};