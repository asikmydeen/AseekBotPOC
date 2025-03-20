// functions/document-analysis/csv-parser.js
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Initialize client
const s3Client = new S3Client();

const downloadCsvFile = async (bucket, key) => {
  console.log(`Downloading CSV file from s3://${bucket}/${key}`);

  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3Client.send(command);

    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    console.error(`Error downloading CSV file: ${error.message}`);
    throw error;
  }
};

/**
 * Parses CSV data from a file buffer
 * @param {Buffer} fileBuffer - The file buffer containing CSV data
 * @param {string} useCase - The use case for parsing (affects processing)
 * @returns {Promise<Array>} - Array of parsed CSV rows
 */
const parseCsvData = (fileBuffer, useCase = 'general') => {
  return new Promise((resolve, reject) => {
    const results = [];

    // Create a readable stream from the buffer
    const readableStream = Readable.from(fileBuffer);

    readableStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(`CSV parsing complete. Found ${results.length} rows.`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
};

exports.handler = async (event) => {
  console.log('Extracting CSV data', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, useCase = 'general' } = event;

  try {
    console.log(`Processing CSV document with ID: ${documentId}`);

    // Download the file from S3
    const fileBuffer = await downloadCsvFile(s3Bucket, s3Key);

    // Parse the CSV data
    const parsedData = await parseCsvData(fileBuffer, useCase);

    console.log(`Successfully extracted data from CSV document: ${documentId}`);

    return {
      ...event,
      extractedText: JSON.stringify(parsedData),
      textExtractionMethod: 'csv-parser'
    };
  } catch (error) {
    console.error('Error extracting CSV data:', error);
    return {
      ...event,
      error: {
        message: error.message,
        stack: error.stack
      },
      textExtractionMethod: 'csv-parser-error'
    };
  }
};
