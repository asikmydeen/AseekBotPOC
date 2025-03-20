const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const mammoth = require('mammoth');

// Initialize client
const s3Client = new S3Client();

/**
 * Downloads a DOCX file from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - File buffer
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
 * Extracts text from a DOCX file buffer with options based on use case
 * @param {Buffer} fileBuffer - DOCX file buffer
 * @param {string} useCase - Use case for text extraction (defaults to 'general')
 * @returns {Promise<{text: string, metadata: Object}>} - Extracted text and metadata
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

    return {
      ...event,
      extractedText: extractionResult.text,
      extractionMetadata: {
        ...extractionResult.metadata,
        timestamp: new Date().toISOString(),
        fileName: s3Key.split('/').pop(),
        extractionMethod: 'mammoth'
      },
      textExtractionMethod: 'docx-parser'
    };
  } catch (error) {
    console.error('Error extracting DOCX text:', error);

    // Return a more useful error response to allow processing to continue
    return {
      ...event,
      extractedText: `Error processing document: ${error.message}. The analysis will proceed with limited information.`,
      error: {
        message: error.message,
        stack: error.stack
      },
      textExtractionMethod: 'docx-parser-error'
    };
  }
};