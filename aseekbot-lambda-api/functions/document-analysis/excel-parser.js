// functions/document-analysis/excel-parser.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const XLSX = require('xlsx');

// Initialize client
const s3Client = new S3Client();

async function downloadExcelFile(bucket, key) {
  console.log(`Downloading Excel file from s3://${bucket}/${key}`);
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
    console.error(`Error downloading Excel file: ${error.message}`);
    throw new Error(`Failed to download Excel file: ${error.message}`);
  }
}

/**
 * Store data in S3 and return a reference
 */
async function storeDataInS3(s3Bucket, documentId, data, type) {
  const s3Key = `document-analysis/${documentId}/${type}-data.json`;

  await s3Client.send(new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    Body: JSON.stringify(data),
    ContentType: 'application/json'
  }));

  console.log(`Successfully stored ${type} data in S3: s3://${s3Bucket}/${s3Key}`);

  return {
    s3Bucket,
    s3Key,
    timestamp: new Date().toISOString()
  };
}

/**
 * Parse Excel data with size constraints in mind
 */
function parseExcelData(fileBuffer, useCase) {
  console.log(`Parsing Excel file for use case: ${useCase}`);

  // Initialize result structure
  const result = {
    sheets: {},
    textContent: '',
    metadata: {
      sheetNames: [],
      rowCounts: {}
    }
  };

  try {
    // Read workbook with full options for better data extraction
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellFormula: true,
      cellStyles: true,
      cellDates: true,
      cellNF: true
    });

    result.metadata.sheetNames = workbook.SheetNames;
    let totalTextLength = 0;

    // Process each sheet with size limits in mind
    workbook.SheetNames.forEach(sheetName => {
      try {
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON with headers
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Store the full data (for S3, not for Step Functions payload)
        result.sheets[sheetName] = sheetData;
        result.metadata.rowCounts[sheetName] = sheetData.length;

        // Build text representation with size limits
        // Keep total under ~20KB to avoid Step Functions payload limits
        if (totalTextLength < 20000) {
          let sheetText = `### Sheet: ${sheetName} ###\n`;

          // Add headers if available
          if (sheetData.length > 0) {
            sheetText += `Headers: ${Object.keys(sheetData[0]).join(', ')}\n\n`;
          }

          // Show a limited number of rows in text representation
          const rowsToShow = Math.min(5, sheetData.length);
          for (let i = 0; i < rowsToShow; i++) {
            const row = sheetData[i];
            const rowText = Object.entries(row)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ');
            sheetText += `Row ${i + 1}: ${rowText}\n`;
          }

          if (sheetData.length > rowsToShow) {
            sheetText += `... and ${sheetData.length - rowsToShow} more rows\n`;
          }

          sheetText += '\n\n';

          // Only add if we won't exceed text limit
          if (totalTextLength + sheetText.length <= 20000) {
            result.textContent += sheetText;
            totalTextLength += sheetText.length;
          } else {
            result.textContent += `### Sheet: ${sheetName} (truncated due to size) ###\n\n`;
          }
        } else {
          result.textContent += `### Sheet: ${sheetName} (not shown due to size limits) ###\n\n`;
        }
      } catch (error) {
        console.warn(`Error processing sheet ${sheetName}: ${error.message}`);
        result.sheets[sheetName] = { error: error.message };
        result.textContent += `### Error processing sheet ${sheetName}: ${error.message} ###\n\n`;
      }
    });

    return result;
  } catch (error) {
    console.error('Error parsing Excel data:', error);
    throw error;
  }
}

/**
 * Extract procurement-specific data
 */
function extractProcurementData(parsedData) {
  const results = {
    prices: [],
    quantities: [],
    partNumbers: [],
    dates: []
  };

  // Process each sheet
  Object.entries(parsedData.sheets).forEach(([sheetName, sheetData]) => {
    if (!Array.isArray(sheetData)) return;

    // Limit rows to process to keep response size manageable
    const maxRowsToProcess = Math.min(50, sheetData.length);

    for (let i = 0; i < maxRowsToProcess; i++) {
      const row = sheetData[i];

      // Process each cell
      Object.entries(row).forEach(([key, value]) => {
        const keyLower = String(key).toLowerCase();

        // Extract prices (limit to 20 items to control size)
        if (results.prices.length < 20 &&
          value && typeof value === 'number' &&
          (keyLower.includes('price') || keyLower.includes('cost') ||
            keyLower.includes('amount') || keyLower.includes('total'))) {
          results.prices.push({ key, value });
        }

        // Extract quantities
        if (results.quantities.length < 20 &&
          value && typeof value === 'number' &&
          (keyLower.includes('qty') || keyLower.includes('quantity') ||
            keyLower.includes('units'))) {
          results.quantities.push({ key, value });
        }

        // Extract part numbers
        if (results.partNumbers.length < 20 &&
          value && typeof value === 'string' &&
          (keyLower.includes('part') || keyLower.includes('sku') ||
            keyLower.includes('item') || keyLower.includes('model'))) {
          results.partNumbers.push({ key, value });
        }

        // Extract dates
        if (results.dates.length < 20 &&
          (value instanceof Date ||
            (typeof value === 'string' &&
              /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(value)))) {
          results.dates.push({
            key,
            value: value instanceof Date ? value.toISOString() : value
          });
        }
      });
    }
  });

  return results;
}

exports.handler = async (event) => {
  console.log('Extracting Excel data', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, fileType } = event;

  // Extract the useCase from the event - this will help determine how to process
  const useCase = event.useCase || 'general';
  console.log(`Using use case: ${useCase}`);

  try {
    // Download the Excel file from S3
    const fileBuffer = await downloadExcelFile(s3Bucket, s3Key);

    // Parse Excel data
    const parsedData = parseExcelData(fileBuffer, useCase);
    console.log(`Successfully parsed Excel file, found ${parsedData.metadata.sheetNames.length} sheets`);

    // Extract procurement-specific data
    const procurementData = extractProcurementData(parsedData);
    console.log(`Extracted procurement data: ${JSON.stringify({
      prices: procurementData.prices.length,
      quantities: procurementData.quantities.length,
      partNumbers: procurementData.partNumbers.length,
      dates: procurementData.dates.length
    })}`);

    // Store full data in S3 to avoid Step Functions payload limit
    const sheetsDataRef = await storeDataInS3(
      s3Bucket,
      documentId,
      parsedData.sheets,
      'excel-sheets'
    );

    const procurementDataRef = await storeDataInS3(
      s3Bucket,
      documentId,
      procurementData,
      'excel-procurement'
    );

    // Return a lightweight response with references to S3 data
    return {
      ...event,
      extractedText: parsedData.textContent, // Limited text content for next steps
      textExtractionMethod: 'excel-parser',
      excelParsingResults: {
        sheetsDataRef,
        procurementDataRef,
        textPreview: parsedData.textContent.substring(0, 500) +
          (parsedData.textContent.length > 500 ? '... (truncated)' : ''),
        sheetCount: parsedData.metadata.sheetNames.length,
        metadata: {
          sheetNames: parsedData.metadata.sheetNames,
          rowCounts: parsedData.metadata.rowCounts,
          timestamp: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    console.error('Error extracting Excel data:', error);

    // Return a compact error response that won't exceed size limits
    return {
      ...event,
      extractedText: `Error processing Excel file: ${error.message}. The analysis will proceed with limited information.`,
      error: {
        message: error.message,
        name: error.name
        // Omit stack trace to save space
      },
      textExtractionMethod: 'excel-parser:error'
    };
  }
};