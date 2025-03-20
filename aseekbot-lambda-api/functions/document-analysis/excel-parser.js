// functions/document-analysis/excel-parser.js
const AWS = require('aws-sdk');
const XLSX = require('xlsx');
const s3 = new AWS.S3();

/**
 * Downloads an Excel file from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} - Excel file as buffer
 */
async function downloadExcelFile(bucket, key) {
  console.log(`Downloading Excel file from s3://${bucket}/${key}`);

  const params = {
    Bucket: bucket,
    Key: key
  };

  const response = await s3.getObject(params).promise();
  return response.Body;
}

/**
 * General parser that extracts all data from all sheets
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Object} - Parsed data with sheet names as keys
 */
function generalParser(fileBuffer) {
  console.log('Using general parser to extract all sheets');

  // Read the workbook from buffer
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const result = {};

  // Process each sheet
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to JSON
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    result[sheetName] = sheetData;
  });

  return result;
}

/**
 * Bid parser that specifically looks for 'Supplier Bid Upload' sheet
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Object} - Parsed bid data
 */
function bidParser(fileBuffer) {
  console.log('Using bid parser to extract Supplier Bid Upload sheet');

  // Read the workbook from buffer
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Check if the required sheet exists
  const targetSheetName = 'Supplier Bid Upload';
  if (!workbook.SheetNames.includes(targetSheetName)) {
    console.warn(`Sheet '${targetSheetName}' not found in the workbook`);
    return { error: `Required sheet '${targetSheetName}' not found` };
  }

  // Extract data from the target sheet
  const worksheet = workbook.Sheets[targetSheetName];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return {
    [targetSheetName]: sheetData
  };
}

exports.handler = async (event) => {
  console.log('Extracting Excel data', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, parserType = 'general-parser' } = event;

  try {
    // Download the Excel file from S3
    const fileBuffer = await downloadExcelFile(s3Bucket, s3Key);

    // Determine which parser to use
    let parsedData;
    let parserUsed;

    if (parserType === 'bid-parser') {
      parsedData = bidParser(fileBuffer);
      parserUsed = 'bid-parser';
    } else {
      // Default to general parser
      parsedData = generalParser(fileBuffer);
      parserUsed = 'general-parser';
    }

    console.log(`Successfully parsed Excel file using ${parserUsed}`);

    return {
      ...event,
      extractedText: JSON.stringify(parsedData),
      textExtractionMethod: `excel-parser:${parserUsed}`
    };
  } catch (error) {
    console.error('Error extracting Excel data:', error);
    return {
      ...event,
      error: {
        message: `Failed to parse Excel file: ${error.message}`,
        stack: error.stack
      },
      textExtractionMethod: 'excel-parser:failed'
    };
  }
};
