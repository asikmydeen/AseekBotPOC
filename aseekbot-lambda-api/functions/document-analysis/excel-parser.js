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
 * Extract meaningful content from Excel data
 */
function extractTextualContent(sheetData) {
  if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) return '';

  return sheetData.map(row => {
    return Object.entries(row)
      .map(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          return `${key}: ${val}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(', ');
  }).join('\n');
}

/**
 * General parser that extracts all data from all sheets
 */
function generalParser(fileBuffer) {
  console.log('Using general parser to extract all sheets');

  // Read the workbook with full options for better data extraction
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellFormula: true,
    cellStyles: true,
    cellDates: true,
    cellNF: true
  });

  const result = {};
  let textContent = '';

  // Process each sheet
  workbook.SheetNames.forEach(sheetName => {
    try {
      const worksheet = workbook.Sheets[sheetName];
      // Convert sheet to JSON with headers
      const sheetData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        header: 'A',
        range: 0
      });

      // Also get the data with column headers for better text representation
      const sheetDataWithHeaders = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Store the full JSON data
      result[sheetName] = sheetDataWithHeaders;

      // Build text representation
      textContent += `### Sheet: ${sheetName} ###\n`;

      // Format headers if available
      if (sheetDataWithHeaders.length > 0) {
        textContent += `Headers: ${Object.keys(sheetDataWithHeaders[0]).join(', ')}\n\n`;
      }

      // Format data rows (limit text representation to first 100 rows to keep manageable)
      const rowsToShow = Math.min(100, sheetDataWithHeaders.length);
      sheetDataWithHeaders.slice(0, rowsToShow).forEach((row, idx) => {
        const rowText = Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        textContent += `Row ${idx + 1}: ${rowText}\n`;
      });

      if (sheetDataWithHeaders.length > rowsToShow) {
        textContent += `... and ${sheetDataWithHeaders.length - rowsToShow} more rows\n`;
      }

      textContent += '\n\n';
    } catch (error) {
      console.warn(`Error processing sheet ${sheetName}: ${error.message}`);
      result[sheetName] = { error: error.message };
      textContent += `### Error processing sheet ${sheetName}: ${error.message} ###\n\n`;
    }
  });

  return {
    sheets: result,
    textContent: textContent.trim(),
    metadata: {
      sheetNames: workbook.SheetNames,
      sheetCount: workbook.SheetNames.length
    }
  };
}

/**
 * Bid parser that specifically looks for procurement-related sheets
 */
function bidParser(fileBuffer) {
  console.log('Using specialized bid parser');

  // Read the workbook with full options
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellFormula: true,
    cellStyles: true,
    cellDates: true,
    cellNF: true
  });

  // Look for commonly used procurement sheet names
  const bidSheetNames = ['Supplier Bid', 'Supplier Bid Upload', 'Pricing', 'Quote', 'Costs', 'Bid'];
  const foundSheets = {};
  let textContent = '';

  // First check for exact matches
  for (const targetName of bidSheetNames) {
    if (workbook.SheetNames.includes(targetName)) {
      const worksheet = workbook.Sheets[targetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      foundSheets[targetName] = sheetData;

      // Build text representation
      textContent += `### Bid Sheet: ${targetName} (EXACT MATCH) ###\n`;
      if (sheetData.length > 0) {
        textContent += `Headers: ${Object.keys(sheetData[0]).join(', ')}\n\n`;
      }

      // Show first 100 rows in text representation
      const rowsToShow = Math.min(100, sheetData.length);
      sheetData.slice(0, rowsToShow).forEach((row, idx) => {
        const rowText = Object.entries(row)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        textContent += `Row ${idx + 1}: ${rowText}\n`;
      });

      if (sheetData.length > rowsToShow) {
        textContent += `... and ${sheetData.length - rowsToShow} more rows\n`;
      }

      textContent += '\n\n';
    }
  }

  // If no exact matches, look for partial matches
  if (Object.keys(foundSheets).length === 0) {
    for (const sheetName of workbook.SheetNames) {
      const lowerSheetName = sheetName.toLowerCase();
      if (bidSheetNames.some(bidName => lowerSheetName.includes(bidName.toLowerCase()))) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        foundSheets[sheetName] = sheetData;

        // Build text representation
        textContent += `### Bid Sheet: ${sheetName} (PARTIAL MATCH) ###\n`;
        if (sheetData.length > 0) {
          textContent += `Headers: ${Object.keys(sheetData[0]).join(', ')}\n\n`;
        }

        // Show first 100 rows in text representation
        const rowsToShow = Math.min(100, sheetData.length);
        sheetData.slice(0, rowsToShow).forEach((row, idx) => {
          const rowText = Object.entries(row)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');
          textContent += `Row ${idx + 1}: ${rowText}\n`;
        });

        if (sheetData.length > rowsToShow) {
          textContent += `... and ${sheetData.length - rowsToShow} more rows\n`;
        }

        textContent += '\n\n';
      }
    }
  }

  // If still no bid sheets found, check content of sheets for bid-related keywords
  if (Object.keys(foundSheets).length === 0) {
    const keywordPatterns = [
      /price/i, /cost/i, /quote/i, /bid/i, /offer/i, /proposal/i, /unit/i,
      /quantity/i, /total/i, /amount/i, /vendor/i, /supplier/i
    ];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      // Check if headers contain bid-related keywords
      if (sheetData.length > 0) {
        const headers = Object.keys(sheetData[0]);
        if (headers.some(header => keywordPatterns.some(pattern => pattern.test(header)))) {
          foundSheets[sheetName] = sheetData;

          // Build text representation
          textContent += `### Bid Sheet: ${sheetName} (KEYWORD MATCH) ###\n`;
          textContent += `Headers: ${headers.join(', ')}\n\n`;

          // Show first 100 rows in text representation
          const rowsToShow = Math.min(100, sheetData.length);
          sheetData.slice(0, rowsToShow).forEach((row, idx) => {
            const rowText = Object.entries(row)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ');
            textContent += `Row ${idx + 1}: ${rowText}\n`;
          });

          if (sheetData.length > rowsToShow) {
            textContent += `... and ${sheetData.length - rowsToShow} more rows\n`;
          }

          textContent += '\n\n';
        }
      }
    }
  }

  // If still no bid sheets found, return the first sheet as fallback
  if (Object.keys(foundSheets).length === 0 && workbook.SheetNames.length > 0) {
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    foundSheets[firstSheet] = sheetData;

    // Build text representation
    textContent += `### Default Sheet: ${firstSheet} (FALLBACK) ###\n`;
    if (sheetData.length > 0) {
      textContent += `Headers: ${Object.keys(sheetData[0]).join(', ')}\n\n`;
    }

    // Show first 100 rows in text representation
    const rowsToShow = Math.min(100, sheetData.length);
    sheetData.slice(0, rowsToShow).forEach((row, idx) => {
      const rowText = Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      textContent += `Row ${idx + 1}: ${rowText}\n`;
    });

    if (sheetData.length > rowsToShow) {
      textContent += `... and ${sheetData.length - rowsToShow} more rows\n`;
    }
  }

  return {
    sheets: foundSheets,
    textContent: textContent.trim(),
    metadata: {
      sheetNames: Object.keys(foundSheets),
      sheetCount: Object.keys(foundSheets).length,
      allSheets: workbook.SheetNames
    }
  };
}

/**
 * Extract key-value pairs that look like procurement data
 */
function extractProcurementData(parsedData) {
  const results = {
    prices: [],
    quantities: [],
    partNumbers: [],
    dates: []
  };

  // Process each sheet
  Object.values(parsedData.sheets).forEach(sheetData => {
    if (!Array.isArray(sheetData)) return;

    sheetData.forEach(row => {
      // Look for pricing information
      Object.entries(row).forEach(([key, value]) => {
        const keyLower = String(key).toLowerCase();

        // Extract prices (limit to 50 items each to avoid excessive data)
        if (value && typeof value === 'number' &&
          (keyLower.includes('price') || keyLower.includes('cost') ||
            keyLower.includes('amount') || keyLower.includes('total'))) {
          if (results.prices.length < 50) {
            results.prices.push({ key, value });
          }
        }

        // Extract quantities
        if (value && typeof value === 'number' &&
          (keyLower.includes('qty') || keyLower.includes('quantity') ||
            keyLower.includes('units'))) {
          if (results.quantities.length < 50) {
            results.quantities.push({ key, value });
          }
        }

        // Extract part numbers
        if (value && typeof value === 'string' &&
          (keyLower.includes('part') || keyLower.includes('sku') ||
            keyLower.includes('item') || keyLower.includes('model'))) {
          if (results.partNumbers.length < 50) {
            results.partNumbers.push({ key, value });
          }
        }

        // Extract dates
        if (value instanceof Date ||
          (typeof value === 'string' &&
            /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(value))) {
          if (results.dates.length < 50) {
            results.dates.push({ key, value: value instanceof Date ? value.toISOString() : value });
          }
        }
      });
    });
  });

  return results;
}

/**
 * Store Excel parsing results in S3 and return a reference
 */
async function storeParsingResultInS3(s3Bucket, documentId, parsedData) {
  try {
    // Generate a unique S3 key for the parsing results
    const s3Key = `document-analysis/${documentId}/excel-parsing-results.json`;

    // Save the full parsed data to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: JSON.stringify(parsedData),
      ContentType: 'application/json'
    }));

    console.log(`Successfully stored parsing results in S3: s3://${s3Bucket}/${s3Key}`);

    return {
      s3Bucket,
      s3Key,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error storing parsing results in S3:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  console.log('Extracting Excel data', JSON.stringify(event, null, 2));

  const { s3Bucket, s3Key, documentId, fileType } = event;

  // Extract the useCase from the event - this will help determine which parser to use
  // Default to 'general' if not specified
  const useCase = event.useCase || 'general';
  console.log(`Using use case: ${useCase}`);

  try {
    // Download the Excel file from S3
    const fileBuffer = await downloadExcelFile(s3Bucket, s3Key);

    // Determine which parser to use based on useCase parameter
    let parsedData;
    let parserUsed;

    if (useCase === 'bid-analysis' || useCase === 'bid-parser' || useCase === 'CODE_INTERPRETER') {
      parsedData = bidParser(fileBuffer);
      parserUsed = 'bid-parser';
    } else {
      // Default to general parser
      parsedData = generalParser(fileBuffer);
      parserUsed = 'general-parser';
    }

    // Extract procurement-specific data for better analysis
    const procurementData = extractProcurementData(parsedData);
    parsedData.procurement = procurementData;

    console.log(`Successfully parsed Excel file using ${parserUsed}, found ${parsedData.metadata.sheetCount} relevant sheets`);

    // Store the full parsed data in S3 to avoid Step Functions payload limits
    const parsingResultRef = await storeParsingResultInS3(s3Bucket, documentId, parsedData);

    // Extract a subset of text for immediate use in the state machine (keep this small)
    // Extract first 1000 chars for preview
    const textPreview = parsedData.textContent.substring(0, 1000) +
      (parsedData.textContent.length > 1000 ? '...(truncated for preview)' : '');

    // Return a lightweight response with a reference to the S3 data
    return {
      ...event,
      extractedText: parsedData.textContent,  // This is needed for next steps
      textExtractionMethod: `excel-parser:${parserUsed}`,
      excelParsingResults: {
        s3Reference: parsingResultRef,
        textPreview: textPreview,
        sheetCount: parsedData.metadata.sheetCount,
        // Include minimal metadata that won't exceed size limits
        metadata: {
          sheetNames: parsedData.metadata.sheetNames,
          timestamp: new Date().toISOString(),
          parserUsed: parserUsed
        }
      }
    };
  } catch (error) {
    console.error('Error extracting Excel data:', error);

    // Return a useful error response
    return {
      ...event,
      extractedText: `Error extracting data from Excel file: ${error.message}. The analysis will proceed with limited information.`,
      error: {
        message: error.message,
        stack: error.stack
      },
      textExtractionMethod: 'excel-parser:error'
    };
  }
};