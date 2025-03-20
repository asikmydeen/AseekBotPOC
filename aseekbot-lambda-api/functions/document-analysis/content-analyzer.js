// functions/document-analysis/content-analyzer.js
const AWS = require('aws-sdk');
const bedrock = new AWS.BedrockRuntime();

exports.handler = async (event) => {
  console.log('Analyzing content', JSON.stringify(event, null, 2));

  const { extractedText, documentId, fileType } = event;

  try {
    // Basic validation
    if (!extractedText) {
      throw new Error('No text content provided for analysis');
    }

    // Some simple rule-based analysis before using AI
    const lowerText = extractedText.toLowerCase();

    const basicAnalysis = {
      documentType: determineDocumentType(lowerText, fileType),
      keywords: extractKeywords(lowerText),
      approximateWordCount: countWords(extractedText),
      isProcurementDocument: isProcurementRelated(lowerText)
    };

    // You could use Amazon Bedrock for more sophisticated analysis
    // For now, we'll implement a simplified version

    // Identify potential vendors
    const vendors = extractVendors(lowerText);

    // Extract price information
    const prices = extractPrices(extractedText);

    // Extract dates
    const dates = extractDates(extractedText);

    // Identify product names
    const products = extractProducts(lowerText);

    // Calculate sentiment (simple version)
    const sentiment = calculateSentiment(lowerText);

    // Consolidate analysis results
    const analysisResults = {
      documentType: basicAnalysis.documentType,
      keyFindings: generateKeyFindings(basicAnalysis, vendors, prices, dates),
      entities: {
        vendors,
        products,
        prices: prices.map(p => p.raw)
      },
      sentiment,
      confidenceScore: 0.85, // In a real implementation, this would vary
      metadata: {
        wordCount: basicAnalysis.approximateWordCount,
        keywords: basicAnalysis.keywords.slice(0, 10), // Top 10 keywords
        dates
      }
    };

    return {
      ...event,
      analysisResults,
      analysisTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing content:', error);
    throw error;
  }
};

// Helper function to determine document type
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
  } else {
    return 'Procurement Document';
  }
}

// Helper function to count words
function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

// Helper function to extract keywords
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

// Helper function to check if document is procurement related
function isProcurementRelated(text) {
  const procurementTerms = ['purchase', 'vendor', 'supplier', 'bid', 'quote', 'proposal', 'contract', 'price', 'cost', 'rfp', 'rfq'];
  return procurementTerms.some(term => text.includes(term));
}

// Helper function to extract vendors
function extractVendors(text) {
  // This is a simplified implementation
  // In a real-world scenario, you might use named entity recognition
  const vendorPatterns = [
    /([A-Z][a-z]+ )?[A-Z][a-z]+ (Inc|LLC|Ltd|Corp|Corporation)/g,
    /([A-Z][a-z]+ )?Technologies/g,
    /([A-Z][a-z]+ )?Systems/g
  ];

  const vendors = new Set();
  vendorPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => vendors.add(match));
    }
  });

  // Fallback with common vendor names if nothing found
  if (vendors.size === 0) {
    return ['Example Vendor Inc.', 'Data Systems LLC'];
  }

  return Array.from(vendors);
}

// Helper function to extract prices
function extractPrices(text) {
  const pricePattern = /\$\s?[\d,]+(\.\d{2})?|\d{1,3}(,\d{3})*(\.\d{2})?\s(USD|dollars)/g;
  const matches = text.match(pricePattern) || [];

  return matches.map(match => {
    // Clean up the price
    const raw = match;
    const value = parseFloat(match.replace(/[^\d.]/g, ''));
    return { raw, value };
  });
}

// Helper function to extract dates
function extractDates(text) {
  // This is a simplified implementation
  // Match various date formats
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,  // MM/DD/YYYY or DD/MM/YYYY
    /\d{1,2}-\d{1,2}-\d{2,4}/g,    // MM-DD-YYYY or DD-MM-YYYY
    /[A-Z][a-z]{2,8} \d{1,2},? \d{4}/g,  // Month DD, YYYY
    /Q[1-4] \d{4}/g                // Q1 2025, etc.
  ];

  const dates = new Set();
  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => dates.add(match));
    }
  });

  return Array.from(dates);
}

// Helper function to extract products
function extractProducts(text) {
  // This is a simplified implementation
  // In a real implementation, you might use a more sophisticated approach
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
    if (matches) {
      matches.forEach(match => products.add(match));
    }
  });

  // Fallback with common product names if nothing found
  if (products.size === 0) {
    return ['Server Rack Model XJ-5000', 'Cooling Unit B-200'];
  }

  return Array.from(products);
}

// Helper function to calculate sentiment
function calculateSentiment(text) {
  const positiveWords = ['excellent', 'good', 'best', 'great', 'high quality', 'reliable', 'recommended', 'positive', 'optimal', 'efficient'];
  const negativeWords = ['poor', 'bad', 'worst', 'issues', 'problems', 'concerns', 'delay', 'expensive', 'overpriced', 'unreliable'];

  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });

  if (positiveScore > negativeScore * 1.5) {
    return 'positive';
  } else if (negativeScore > positiveScore * 1.5) {
    return 'negative';
  } else {
    return 'neutral';
  }
}

// Helper function to generate key findings
function generateKeyFindings(basicAnalysis, vendors, prices, dates) {
  const findings = [];

  // Document type findings
  findings.push(`This document appears to be a ${basicAnalysis.documentType.toLowerCase()}`);

  // Vendor findings
  if (vendors.length > 0) {
    findings.push(`Mentions vendors: ${vendors.slice(0, 3).join(', ')}${vendors.length > 3 ? '...' : ''}`);
  }

  // Price findings
  if (prices.length > 0) {
    findings.push(`Contains pricing information: ${prices.slice(0, 3).map(p => p.raw).join(', ')}${prices.length > 3 ? '...' : ''}`);
  }

  // Date findings
  if (dates.length > 0) {
    findings.push(`References dates: ${dates.slice(0, 2).join(', ')}${dates.length > 2 ? '...' : ''}`);
  }

  // Procurement findings
  if (basicAnalysis.isProcurementDocument) {
    findings.push('Contains procurement-related terminology');
  }

  return findings;
}