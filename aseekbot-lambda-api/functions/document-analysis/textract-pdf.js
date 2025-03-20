// functions/document-analysis/textract-pdf.js
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

// Helper function to extract text from blocks
const extractTextFromBlocks = (blocks) => {
  let text = '';
  if (!blocks || !Array.isArray(blocks)) return text;

  for (const block of blocks) {
    if (block.BlockType === 'LINE') {
      text += block.Text + '\n';
    }
  }
  return text;
};

exports.handler = async (event) => {
  console.log('Extracting PDF text using Textract', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId } = event;
  let fileSize = 0;
  let extractedText = '';

  try {
    // Get the S3 object metadata
    const s3Response = await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key
      })
    );

    // Check the file size
    fileSize = s3Response.ContentLength;
    console.log(`PDF file size: ${fileSize} bytes`);

    // For small PDFs, try synchronous first
    if (fileSize && fileSize < 5 * 1024 * 1024) {
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

        // Use the DetectDocumentText API
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

    // If synchronous method failed or file is large, use asynchronous method
    if (!extractedText.trim()) {
      console.log('Using asynchronous StartDocumentTextDetection API');

      // Start the asynchronous text detection job
      const startResponse = await textractClient.send(
        new StartDocumentTextDetectionCommand({
          DocumentLocation: {
            S3Object: {
              Bucket: s3Bucket,
              Name: s3Key
            }
          },
          JobTag: `document-${documentId}`
        })
      );

      const jobId = startResponse.JobId;
      console.log(`Started Textract job with ID: ${jobId}`);

      // Poll for completion with exponential backoff
      let jobResult;
      let jobStatus = 'IN_PROGRESS';
      let retries = 0;
      const maxRetries = 60; // More retries for longer documents

      while (jobStatus === 'IN_PROGRESS' && retries < maxRetries) {
        // Wait based on retry count (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(1.5, retries), 20000); // Up to 20 seconds wait
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
      if (jobResult && jobResult.Blocks) {
        console.log(`Processing ${jobResult.Blocks.length} blocks from async job result`);

        // Extract text from the blocks
        let textFromBlocks = extractTextFromBlocks(jobResult.Blocks);
        if (textFromBlocks) {
          extractedText += textFromBlocks;
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
            textFromBlocks = extractTextFromBlocks(pageResponse.Blocks);
            if (textFromBlocks) {
              extractedText += textFromBlocks;
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
        extractedText: "This document appears to be a scanned image or contains text that our OCR system couldn't extract. The analysis will proceed with limited information available.",
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
        lineCount: extractedText.split('\n').length - 1
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);

    // Make sure we always return something that allows the step function to continue
    return {
      ...event,
      extractedText: `This PDF document (${s3Key.split('/').pop()}) could not be processed due to technical issues. Error: ${error.message}. The workflow will continue with limited text information.`,
      textExtractionMethod: 'error-with-fallback',
      extractionError: error.message,
      extractionDetails: {
        errorCode: error.$metadata?.httpStatusCode || 'unknown',
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};