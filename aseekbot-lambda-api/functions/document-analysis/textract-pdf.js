// functions/document-analysis/textract-pdf.js
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
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
    } else if (block.BlockType === 'PAGE' || block.BlockType === 'WORD') {
      // Skip these types as we're focused on LINE blocks
    } else if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
      if (block.Relationships) {
        for (const relationship of block.Relationships) {
          if (relationship.Type === 'VALUE') {
            // This is a key-value pair, could extract in a structured way
          }
        }
      }
    }
    // Could add more sophisticated handling for tables, forms, etc.
  }
  return text;
};

exports.handler = async (event) => {
  console.log('Extracting PDF text using Textract (advanced)', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId } = event;
  let fileSize = 0;
  let extractedText = '';
  let extractionMethods = [];

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
          const detectText = extractTextFromBlocks(detectResponse.Blocks);
          if (detectText.trim()) {
            extractedText += detectText;
            extractionMethods.push('DetectDocumentText');
          }
        }

        // APPROACH 2: Use AnalyzeDocument API with FORMS/TABLES features for more advanced extraction
        const analyzeResponse = await textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              Bytes: buffer
            },
            FeatureTypes: ['FORMS', 'TABLES'] // Extract forms and tables
          })
        );

        // Extract text from the analysis response
        if (analyzeResponse.Blocks && analyzeResponse.Blocks.length > 0) {
          console.log(`Analyzed ${analyzeResponse.Blocks.length} blocks with AnalyzeDocument`);
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
            FeatureTypes: ['FORMS', 'TABLES'], // Extract forms and tables
            JobTag: `analyze-${documentId}` // For better tracking
          })
        );

        const analysisJobId = startAnalysisResponse.JobId;
        console.log(`Started Textract analysis job with ID: ${analysisJobId}`);

        // Poll for completion with exponential backoff
        let analysisResult;
        let analysisStatus = 'IN_PROGRESS';
        let retries = 0;
        const maxRetries = 30; // Increased for longer documents

        while (analysisStatus === 'IN_PROGRESS' && retries < maxRetries) {
          // Wait with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(1.5, retries), 15000); // Wait between 1-15s
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
            break; // Don't throw error, try text detection instead
          }

          retries++;
        }

        // Process analysis results if successful
        if (analysisResult && analysisResult.Blocks) {
          console.log(`Processing ${analysisResult.Blocks.length} blocks from async analysis`);
          let analysisText = extractTextFromBlocks(analysisResult.Blocks);

          // Handle pagination for analysis results
          let nextToken = analysisResult.NextToken;
          while (nextToken) {
            console.log('Fetching additional analysis pages');
            const pageResponse = await textractClient.send(
              new GetDocumentAnalysisCommand({
                JobId: analysisJobId,
                NextToken: nextToken
              })
            );

            if (pageResponse.Blocks) {
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
              JobTag: `detect-${documentId}` // For better tracking
            })
          );

          const detectionJobId = startDetectionResponse.JobId;
          console.log(`Started Textract text detection job with ID: ${detectionJobId}`);

          // Poll for completion
          let detectionResult;
          let detectionStatus = 'IN_PROGRESS';
          let retries = 0;
          const maxRetries = 30; // Increased for longer documents

          while (detectionStatus === 'IN_PROGRESS' && retries < maxRetries) {
            // Wait with exponential backoff
            const waitTime = Math.min(1000 * Math.pow(1.5, retries), 15000); // Wait between 1-15s
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
            let detectionText = extractTextFromBlocks(detectionResult.Blocks);

            // Handle pagination for detection results
            let nextToken = detectionResult.NextToken;
            while (nextToken) {
              console.log('Fetching additional detection pages');
              const pageResponse = await textractClient.send(
                new GetDocumentTextDetectionCommand({
                  JobId: detectionJobId,
                  NextToken: nextToken
                })
              );

              if (pageResponse.Blocks) {
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

      // Return a placeholder text to allow processing to continue
      // This is more informative than the previous error
      return {
        ...event,
        extractedText: "This document appears to contain primarily image content or is using a format that our current OCR system couldn't process. We've recorded this for improvement. You can still proceed with the analysis, but it will be limited to the document's metadata.",
        textExtractionMethod: "textract-empty-result",
        extractionDetails: {
          fileSize,
          timestamp: new Date().toISOString(),
          attempts: extractionMethods
        }
      };
    }

    console.log(`Successfully extracted text from PDF using methods: ${extractionMethods.join(', ')}`);

    // Return the extracted text along with metadata
    return {
      ...event,
      extractedText,
      textExtractionMethod: extractionMethods.join('+'),
      extractionDetails: {
        fileSize,
        timestamp: new Date().toISOString(),
        characterCount: extractedText.length,
        lineCount: extractedText.split('\n').length,
        methods: extractionMethods
      }
    };
  } catch (error) {
    console.error('Error extracting PDF text:', error);

    // Create a fallback extraction result to keep the workflow going
    return {
      ...event,
      extractedText: `This document (${s3Key.split('/').pop()}) requires manual review. Error: ${error.message}. The analysis will proceed with limited information.`,
      textExtractionMethod: 'error-with-fallback',
      extractionError: error.message,
      extractionDetails: {
        errorCode: error.Code || error.code || error.$metadata?.httpStatusCode || 'unknown',
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
        attempts: extractionMethods
      }
    };
  }
};