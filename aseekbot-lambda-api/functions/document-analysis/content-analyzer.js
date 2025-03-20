// functions/document-analysis/content-analyzer.js
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client();

/**
 * Fetches data from S3 given a reference
 */
async function getDataFromS3(reference) {
  if (!reference || !reference.s3Bucket || !reference.s3Key) return null;

  try {
    console.log(`Retrieving data from S3: ${reference.s3Bucket}/${reference.s3Key}`);

    const command = new GetObjectCommand({
      Bucket: reference.s3Bucket,
      Key: reference.s3Key
    });

    const response = await s3Client.send(command);

    // Convert stream to text and parse JSON
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const text = buffer.toString('utf-8');

    return JSON.parse(text);
  } catch (error) {
    console.error(`Error retrieving data from S3: ${error.message}`);
    return null;
  }
}

/**
 * Fetches Excel data from S3 references when available
 */
async function getExcelDataFromS3(event) {
  if (!event.excelParsingResults) return null;

  const results = {};

  // Get full sheet data
  if (event.excelParsingResults.fullDataRef) {
    results.sheets = await getDataFromS3(event.excelParsingResults.fullDataRef);
  }

  // Get procurement data
  if (event.excelParsingResults.procurementDataRef) {
    results.procurement = await getDataFromS3(event.excelParsingResults.procurementDataRef);
  }

  // Add any metadata that was already in the step function payload
  if (event.excelParsingResults.metadata) {
    results.metadata = event.excelParsingResults.metadata;
  }

  return Object.keys(results).length ? results : null;
}

exports.handler = async (event) => {
  console.log('Analyzing content for documentId:', event.documentId);

  const { extractedText, documentId, fileType } = event;

  try {
    // Basic validation
    if (!extractedText) {
      throw new Error('No text content provided for analysis');
    }

    // Get Excel data from S3 if available
    const excelData = await getExcelDataFromS3(event);

    // Some simple rule-based analysis before using AI
    const lowerText = extractedText.toLowerCase();

    const basicAnalysis = {
      documentType: determineDocumentType(lowerText, fileType),
      keywords: extractKeywords(lowerText),
      approximateWordCount: countWords(extractedText),
      isProcurementDocument: isProcurementRelated(lowerText)
    };

    // Build entities using excel data when available
    const entities = {
      vendors: excelData?.procurement?.partNumbers?.map(item => item.value) ||
        extractVendors(lowerText),
      products: extractProducts(lowerText),
      prices: excelData?.procurement?.prices?.map(item => `${item.key}: ${item.value}`) ||
        extractPrices(extractedText).map(p => p.raw || p)
    };

    // Dates from excel data or extracted from text
    const dates = excelData?.procurement?.dates?.map(item => item.value) ||
      extractDates(extractedText);

    // Calculate sentiment
    const sentiment = calculateSentiment(lowerText);

    // Build key findings
    const keyFindings = generateKeyFindings(basicAnalysis, entities.vendors,
      entities.prices, dates);

    // Consolidate analysis results
    const analysisResults = {
      documentType: basicAnalysis.documentType,
      keyFindings,
      entities,
      sentiment,
      confidenceScore: 0.85,
      metadata: {
        wordCount: basicAnalysis.approximateWordCount,
        keywords: basicAnalysis.keywords.slice(0, 10),
        dates
      }
    };

    // Add Excel-specific information if available
    if (excelData) {
      // Include sheet metadata but not full content to keep payload small
      analysisResults.excelAnalysis = {
        sheetCount: excelData.metadata?.sheetNames?.length || 0,
        sheetNames: excelData.metadata?.sheetNames || [],
        dataPoints: {
          prices: excelData.procurement?.prices?.length || 0,
          quantities: excelData.procurement?.quantities?.length || 0,
          partNumbers: excelData.procurement?.partNumbers?.length || 0,
          dates: excelData.procurement?.dates?.length || 0
        }
      };
    }

    return {
      ...event,
      analysisResults,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing content:', error);

    // Return a simplified error response to avoid payload size issues
    return {
      ...event,
      analysisResults: {
        error: error.message,
        documentType: "Unknown (Error)",
        keyFindings: ["Error during document analysis"],
        entities: { vendors: [], products: [], prices: [] },
        sentiment: "neutral",
        metadata: {
          error: true,
          errorTimestamp: new Date().toISOString()
        }
      },
      analysisTimestamp: new Date().toISOString(),
      error: {
        message: error.message,
        name: error.name
      }
    };
  }
};

// Helper functions (implementations from original not changed)
function determineDocumentType(text, fileType) {
  if (text.includes('proposal') || text.includes('quote')) {
    return 'Vendor Proposal';
  } else if (text.includes('contract') || text.includes('agreement')) {
    return 'Contract Document';
  } else if (text.includes('invoice') || text.includes('payment')) {
    return 'Invoice';
  } else if (text.includes('specification') || text.includes('spec ') || text.includes('specs')) {
    return 'Technical Specification';
  } else if (text.includes('rfp') || text.includes('request for proposal')) {
    return 'RFP Document';
  } else if (fileType === 'xlsx' || fileType === 'csv') {
    return 'Spreadsheet Data';
  } else {
    return 'Procurement Document';
  }
}

function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function extractKeywords(text) {
  const stopWords = ['the', 'and', 'a', 'to', 'in', 'of', 'for', 'is', 'on', 'that', 'this', 'with', 'as', 'by'];
  const words = text.split(/\W+/).filter(word =>
    word.length > 2 && !stopWords.includes(word.toLowerCase())
  );

  // Count word frequency
  const wordFrequency = {};
  words.forEach(word => {
    const lowerWord = word.toLowerCase();
    wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
  });

  // Sort by frequency
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

function isProcurementRelated(text) {
  const procurementTerms = ['purchase', 'vendor', 'supplier', 'bid', 'quote', 'proposal', 'contract', 'price', 'cost', 'rfp', 'rfq'];
  return procurementTerms.some(term => text.includes(term));
}

function extractVendors(text) {
  const vendorPatterns = [
    /([A-Z][a-z]+ )?[A-Z][a-z]+ (Inc|LLC|Ltd|Corp|Corporation)/g,
    /([A-Z][a-z]+ )?Technologies/g,
    /([A-Z][a-z]+ )?Systems/g
  ];

  const vendors = new Set();
  vendorPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) matches.forEach(match => vendors.add(match));
  });

  return vendors.size > 0 ? Array.from(vendors) : ['Example Vendor Inc.', 'Data Systems LLC'];
}

function extractPrices(text) {
  const pricePattern = /\$\s?[\d,]+(\.\d{2})?|\d{1,3}(,\d{3})*(\.\d{2})?\s(USD|dollars)/g;
  const matches = text.match(pricePattern) || [];

  return matches.map(match => ({
    raw: match,
    value: parseFloat(match.replace(/[^\d.]/g, ''))
  }));
}

function extractDates(text) {
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\d{1,2}-\d{1,2}-\d{2,4}/g,
    /[A-Z][a-z]{2,8} \d{1,2},? \d{4}/g,
    /Q[1-4] \d{4}/g
  ];

  const dates = new Set();
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) matches.forEach(match => dates.add(match));
  });

  return Array.from(dates);
}

function extractProducts(text) {
  const productPatterns = [
    /[A-Z][a-z]+ Rack [A-Z0-9\-]+/g,
    /[A-Z][a-z]+ Server [A-Z0-9\-]+/g,
    /[A-Z][a-z]+ (Router|Switch|Firewall) [A-Z0-9\-]+/g,
    /[A-Z][a-z]+ (Storage|Array) [A-Z0-9\-]+/g,
    /[A-Z][a-z]+ (Cooling|UPS|PDU) [A-Z0-9\-]+/g
  ];

  const products = new Set();
  productPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) matches.forEach(match => products.add(match));
  });

  return products.size > 0 ? Array.from(products) : ['Server Rack Model XJ-5000', 'Cooling Unit B-200'];
}

function calculateSentiment(text) {
  const positiveWords = ['excellent', 'good', 'best', 'great', 'high quality', 'reliable', 'recommended', 'positive', 'optimal', 'efficient'];
  const negativeWords = ['poor', 'bad', 'worst', 'issues', 'problems', 'concerns', 'delay', 'expensive', 'overpriced', 'unreliable'];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length;
  });

  if (positiveScore > negativeScore * 1.5) return 'positive';
  else if (negativeScore > positiveScore * 1.5) return 'negative';
  else return 'neutral';
}

function generateKeyFindings(basicAnalysis, vendors, prices, dates) {
  const findings = [];

  findings.push(`This document appears to be a ${basicAnalysis.documentType.toLowerCase()}`);

  if (vendors && vendors.length > 0) {
    findings.push(`Mentions vendors: ${vendors.slice(0, 3).join(', ')}${vendors.length > 3 ? '...' : ''}`);
  }

  if (prices && prices.length > 0) {
    findings.push(`Contains pricing information: ${prices.slice(0, 3).join(', ')}${prices.length > 3 ? '...' : ''}`);
  }

  if (dates && dates.length > 0) {
    findings.push(`References dates: ${dates.slice(0, 2).join(', ')}${dates.length > 2 ? '...' : ''}`);
  }

  if (basicAnalysis.isProcurementDocument) {
    findings.push('Contains procurement-related terminology');
  }

  return findings;
}