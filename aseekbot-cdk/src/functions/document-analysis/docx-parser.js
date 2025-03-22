// functions/document-analysis/docx-parser.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const mammoth = require('mammoth');

// Initialize client
const s3Client = new S3Client();

/**
 * Downloads a DOCX file from S3
 */
async function downloadDocxFile(bucket, key) {
  console.log(`Downloading DOCX file from s3://${bucket}/${key}`);

  try {
    const params = { Bucket: bucket, Key: key };
    const response = await s3Client.send(new GetObjectCommand(params));

    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Error downloading DOCX file: ${error.message}`);
    throw new Error(`Failed to download DOCX file: ${error.message}`);
  }
}

/**
 * Store DOCX content in S3 if it exceeds size threshold
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

/**
 * Extracts text from a DOCX file buffer with options based on use case
 */
async function extractTextFromDocx(fileBuffer, useCase = 'general') {
  console.log(`Extracting text from DOCX file for use case: ${useCase}`);

  try {
    // Extract raw text
    const textResult = await mammoth.extractRawText({ buffer: fileBuffer });

    // Extract document metadata and styled content for better analysis
    const options = { includeDefaultStyleMap: true };
    const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer }, options);

    // Extract any images if needed
    let images = [];
    if (useCase === 'DOCUMENT_ANALYSIS' || useCase === 'full') {
      const imgOptions = {
        convertImage: mammoth.images.imgElement(image => {
          images.push({ contentType: image.contentType });
          return { src: `image-${images.length}` };
        })
      };
      await mammoth.convertToHtml({ buffer: fileBuffer }, imgOptions);
    }

    return {
      text: textResult.value,
      html: htmlResult.value,
      metadata: {
        images: images.length,
        warnings: [...textResult.messages, ...htmlResult.messages],
        htmlLength: htmlResult.value.length,
        textLength: textResult.value.length
      }
    };
  } catch (error) {
    console.error(`Error extracting text from DOCX: ${error.message}`);
    throw new Error(`Text extraction failed: ${error.message}`);
  }
}

exports.handler = async (event) => {
  console.log('Extracting DOCX text', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, useCase = 'general' } = event;

  try {
    // Download the file from S3
    const fileBuffer = await downloadDocxFile(s3Bucket, s3Key);

    // Extract text from the DOCX file
    const extractionResult = await extractTextFromDocx(fileBuffer, useCase);
    console.log(`Successfully extracted text (${extractionResult.text.length} chars) with ${extractionResult.metadata.images} images`);

    // Check if text content is too large for Step Functions payload
    // Threshold set conservatively at 100KB to allow room for other fields
    const isTextTooLarge = extractionResult.text.length > 100000;
    const isHtmlTooLarge = extractionResult.html.length > 50000;

    let textRef = null;
    let htmlRef = null;

    // Store large text content in S3 if needed
    if (isTextTooLarge) {
      console.log(`Text content too large (${extractionResult.text.length} chars), storing in S3`);
      textRef = await storeContentInS3(s3Bucket, documentId, extractionResult.text, 'docx-text');
    }

    // Store HTML in S3 if needed
    if (isHtmlTooLarge) {
      console.log(`HTML content too large (${extractionResult.html.length} chars), storing in S3`);
      htmlRef = await storeContentInS3(s3Bucket, documentId, extractionResult.html, 'docx-html');
    }

    // Prepare text content for the response
    // If text is too large, provide a preview and reference to S3
    const textForResponse = isTextTooLarge
      ? extractionResult.text.substring(0, 50000) + '... (truncated, full content in S3)'
      : extractionResult.text;

    return {
      ...event,
      extractedText: textForResponse,
      extractionMetadata: {
        ...extractionResult.metadata,
        timestamp: new Date().toISOString(),
        fileName: s3Key.split('/').pop(),
        extractionMethod: 'mammoth',
        textContentStored: isTextTooLarge,
        htmlContentStored: isHtmlTooLarge
      },
      textExtractionMethod: 'docx-parser',
      docxParsingResults: {
        textRef,
        htmlRef,
        textPreview: extractionResult.text.substring(0, 500) +
          (extractionResult.text.length > 500 ? '... (truncated)' : '')
      }
    };
  } catch (error) {
    console.error('Error extracting DOCX text:', error);

    // Return a more useful error response with limited size
    return {
      ...event,
      extractedText: `Error processing document: ${error.message}. The analysis will proceed with limited information.`,
      error: {
        message: error.message,
        name: error.name
        // Exclude stack trace to reduce payload size
      },
      textExtractionMethod: 'docx-parser-error'
    };
  }
}