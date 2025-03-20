// functions/document-analysis/textract-handler.js
const { S3Client, GetObjectCommand, HeadObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  AnalyzeDocumentCommand
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

/**
 * Store large content in S3
 */
async function storeContentInS3(s3Bucket, documentId, content, contentType) {
  try {
    const s3Key = `document-analysis/${documentId}/${contentType}-content.json`;

    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    }));

    console.log(`Stored ${contentType} in S3: s3://${s3Bucket}/${s3Key}`);

    return {
      s3Bucket,
      s3Key,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error storing content in S3: ${error.message}`);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log('Extracting document text using Textract', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, fileType } = event;
  let fileSize = 0;
  let extractedText = '';
  let extractionMethods = [];
  let blocksData = []; // Store blocks for potential S3 storage

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
    console.log(`Document file size: ${fileSize} bytes, type: ${fileType}`);

    // For small files (<5MB), use synchronous DetectDocumentText and AnalyzeDocument
    if (fileSize < 5 * 1024 * 1024) {
      console.log('Using synchronous APIs for small file');

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

        // APPROACH 1: Use DetectDocumentText API for basic OCR
        const detectResponse = await textractClient.send(
          new DetectDocumentTextCommand({
            Document: {
              Bytes: buffer
            }
          })
        );

        // Extract text from the response
        if (detectResponse.Blocks && detectResponse.Blocks.length > 0) {
          console.log(`Detected ${detectResponse.Blocks.length} blocks with DetectDocumentText`);
          blocksData = blocksData.concat(detectResponse.Blocks);
          const detectText = extractTextFromBlocks(detectResponse.Blocks);
          if (detectText.trim()) {
            extractedText += detectText;
            extractionMethods.push('DetectDocumentText');
          }
        }

        // APPROACH 2: Use AnalyzeDocument API with FORMS/TABLES features
        const analyzeResponse = await textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              Bytes: buffer
            },
            FeatureTypes: ['FORMS', 'TABLES']
          })
        );

        // Extract text from the analysis response
        if (analyzeResponse.Blocks && analyzeResponse.Blocks.length > 0) {
          console.log(`Analyzed ${analyzeResponse.Blocks.length} blocks with AnalyzeDocument`);
          blocksData = blocksData.concat(analyzeResponse.Blocks);
          const analyzeText = extractTextFromBlocks(analyzeResponse.Blocks);
          if (analyzeText.trim() && (!extractedText || analyzeText.length > extractedText.length)) {
            extractedText = analyzeText; // Use the better result
            extractionMethods.push('AnalyzeDocument');
          }
        }
      } catch (syncError) {
        console.log('Synchronous extraction failed:', syncError.message);
        // Continue to asynchronous methods
      }
    }

    // For larger files or if synchronous method failed, use asynchronous methods
    if (extractedText.length === 0) {
      console.log('Using asynchronous Textract APIs');

      // APPROACH 3: Use asynchronous document analysis with FORMS and TABLES features
      try {
        // Start the asynchronous document analysis job
        const startAnalysisResponse = await textractClient.send(
          new StartDocumentAnalysisCommand({
            DocumentLocation: {
              S3Object: {
                Bucket: s3Bucket,
                Name: s3Key
              }
            },
            FeatureTypes: ['FORMS', 'TABLES'],
            JobTag: `analyze-${documentId}`
          })
        );

        const analysisJobId = startAnalysisResponse.JobId;
        console.log(`Started Textract analysis job with ID: ${analysisJobId}`);

        // Poll for completion with exponential backoff
        let analysisResult;
        let analysisStatus = 'IN_PROGRESS';
        let retries = 0;
        const maxRetries = 30;

        while (analysisStatus === 'IN_PROGRESS' && retries < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(1.5, retries), 15000);
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // Get the job status
          const getResponse = await textractClient.send(
            new GetDocumentAnalysisCommand({
              JobId: analysisJobId
            })
          );

          analysisStatus = getResponse.JobStatus;
          console.log(`Analysis job status after ${retries + 1} checks: ${analysisStatus}`);

          if (analysisStatus === 'SUCCEEDED') {
            analysisResult = getResponse;
            break;
          } else if (analysisStatus === 'FAILED') {
            console.log(`Analysis job failed: ${getResponse.StatusMessage || 'Unknown error'}`);
            break;
          }

          retries++;
        }

        // Process analysis results if successful
        if (analysisResult && analysisResult.Blocks) {
          console.log(`Processing ${analysisResult.Blocks.length} blocks from async analysis`);
          blocksData = blocksData.concat(analysisResult.Blocks);
          let analysisText = extractTextFromBlocks(analysisResult.Blocks);

          // Handle pagination for analysis results
          let nextToken = analysisResult.NextToken;
          let pageCount = 1;

          while (nextToken) {
            console.log(`Fetching additional analysis page ${++pageCount}`);
            const pageResponse = await textractClient.send(
              new GetDocumentAnalysisCommand({
                JobId: analysisJobId,
                NextToken: nextToken
              })
            );

            if (pageResponse.Blocks) {
              blocksData = blocksData.concat(pageResponse.Blocks);
              analysisText += extractTextFromBlocks(pageResponse.Blocks);
            }
            nextToken = pageResponse.NextToken;
          }

          if (analysisText.trim()) {
            extractedText = analysisText;
            extractionMethods.push('StartDocumentAnalysis');
          }
        }
      } catch (analysisError) {
        console.log('Asynchronous analysis failed:', analysisError.message);
        // Continue to text detection method
      }

      // APPROACH 4: If analysis failed or gave no results, try asynchronous text detection
      if (extractedText.length === 0) {
        try {
          // Start the asynchronous text detection job
          const startDetectionResponse = await textractClient.send(
            new StartDocumentTextDetectionCommand({
              DocumentLocation: {
                S3Object: {
                  Bucket: s3Bucket,
                  Name: s3Key
                }
              },
              JobTag: `detect-${documentId}`
            })
          );

          const detectionJobId = startDetectionResponse.JobId;
          console.log(`Started Textract text detection job with ID: ${detectionJobId}`);

          // Poll for completion
          let detectionResult;
          let detectionStatus = 'IN_PROGRESS';
          let retries = 0;
          const maxRetries = 30;

          while (detectionStatus === 'IN_PROGRESS' && retries < maxRetries) {
            const waitTime = Math.min(1000 * Math.pow(1.5, retries), 15000);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // Get the job status
            const getResponse = await textractClient.send(
              new GetDocumentTextDetectionCommand({
                JobId: detectionJobId
              })
            );

            detectionStatus = getResponse.JobStatus;
            console.log(`Detection job status after ${retries + 1} checks: ${detectionStatus}`);

            if (detectionStatus === 'SUCCEEDED') {
              detectionResult = getResponse;
              break;
            } else if (detectionStatus === 'FAILED') {
              throw new Error(`Text detection job failed: ${getResponse.StatusMessage || 'Unknown error'}`);
            }

            retries++;
          }

          if (detectionStatus === 'IN_PROGRESS') {
            throw new Error('Textract job timed out - still in progress after maximum wait time');
          }

          // Process detection results
          if (detectionResult && detectionResult.Blocks) {
            console.log(`Processing ${detectionResult.Blocks.length} blocks from text detection`);
            blocksData = blocksData.concat(detectionResult.Blocks);
            let detectionText = extractTextFromBlocks(detectionResult.Blocks);

            // Handle pagination for detection results
            let nextToken = detectionResult.NextToken;
            let pageCount = 1;

            while (nextToken) {
              console.log(`Fetching additional detection page ${++pageCount}`);
              const pageResponse = await textractClient.send(
                new GetDocumentTextDetectionCommand({
                  JobId: detectionJobId,
                  NextToken: nextToken
                })
              );

              if (pageResponse.Blocks) {
                blocksData = blocksData.concat(pageResponse.Blocks);
                detectionText += extractTextFromBlocks(pageResponse.Blocks);
              }
              nextToken = pageResponse.NextToken;
            }

            if (detectionText.trim()) {
              extractedText = detectionText;
              extractionMethods.push('StartDocumentTextDetection');
            }
          }
        } catch (detectionError) {
          console.log('Asynchronous text detection failed:', detectionError.message);
        }
      }
    }

    // If we didn't get any text, provide a meaningful message
    if (!extractedText.trim()) {
      console.log('No text was extracted from the document even with OCR');
      extractedText = "This document appears to contain primarily image content or is using a format that our OCR system couldn't process. The analysis will proceed with limited information.";
      extractionMethods.push('textract-empty-result');
    }

    // Check if extracted text is too large for Step Functions payload
    const isTextTooLarge = extractedText.length > 100000;
    let textRef = null;
    let blocksRef = null;

    // Store large text content in S3 if needed
    if (isTextTooLarge) {
      console.log(`Extracted text too large (${extractedText.length} chars), storing in S3`);
      textRef = await storeContentInS3(s3Bucket, documentId, extractedText, `${fileType}-extracted-text`);
    }

    // Store blocks data in S3 if it's large
    if (blocksData.length > 1000) {
      console.log(`Blocks data large (${blocksData.length} blocks), storing in S3`);
      blocksRef = await storeContentInS3(s3Bucket, documentId, blocksData, `${fileType}-blocks`);
    }

    // Prepare text content for the response
    const textForResponse = isTextTooLarge
      ? extractedText.substring(0, 50000) + '... (truncated, full content in S3)'
      : extractedText;

    console.log(`Successfully extracted text from ${fileType} file using methods: ${extractionMethods.join(', ')}`);

    // Return the extracted text along with metadata
    return {
      ...event,
      extractedText: textForResponse,
      textExtractionMethod: extractionMethods.join('+'),
      textractResults: {
        textRef,
        blocksRef,
        textPreview: extractedText.substring(0, 500) +
          (extractedText.length > 500 ? '... (truncated)' : '')
      },
      extractionDetails: {
        fileSize,
        fileType,
        timestamp: new Date().toISOString(),
        characterCount: extractedText.length,
        lineCount: extractedText.split('\n').length,
        methods: extractionMethods,
        pagesProcessed: blocksData.length > 0 ?
          new Set(blocksData.filter(b => b.BlockType === 'PAGE').map(b => b.Page)).size : 0
      }
    };
  } catch (error) {
    console.error(`Error extracting text from ${fileType} file:`, error);

    // Return a lightweight error response
    return {
      ...event,
      extractedText: `Error processing document: ${error.message}. The analysis will proceed with limited information.`,
      textExtractionMethod: 'error-with-fallback',
      error: {
        message: error.message,
        name: error.name
      }
    };
  }
};