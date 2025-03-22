// functions/document-analysis/insight-generator.js
const { invokeBedrockAgent } = require('../../utils/invokeBedrockAgent');

exports.handler = async (event) => {
    console.log('Generating insights', JSON.stringify(event, null, 2));

    const { analysisResults, comparisonResults = null, documentId, fileType } = event;

    try {
        // Extract key information from analysis results
        const docType = analysisResults?.documentType || 'Unknown';
        const sentiment = analysisResults?.sentiment || 'neutral';
        const vendors = analysisResults?.entities?.vendors || [];
        const products = analysisResults?.entities?.products || [];
        const prices = analysisResults?.entities?.prices || [];
        const keyFindings = analysisResults?.keyFindings || [];

        // Generate a summary using rule-based approach as fallback
        let summary = `This ${docType} `;

        if (vendors.length > 0) {
            summary += `from ${vendors[0]} `;
        }

        if (products.length > 0) {
            summary += `relates to ${products.length} product${products.length !== 1 ? 's' : ''} `;
        }

        if (prices.length > 0) {
            summary += `with pricing information`;
        } else {
            summary += `requires further review`;
        }

        // Generate key points
        const keyPoints = [];

        // Document sentiment
        if (sentiment === 'positive') {
            keyPoints.push('Document language is generally positive, suggesting a favorable proposal');
        } else if (sentiment === 'negative') {
            keyPoints.push('Document contains negative language that may indicate issues or concerns');
        } else {
            keyPoints.push('Document has a neutral tone, typical for formal business communications');
        }

        // Pricing insights
        if (prices.length > 0) {
            keyPoints.push('Pricing details are explicitly mentioned and should be reviewed carefully');
        } else {
            keyPoints.push('No explicit pricing was found, additional inquiry may be needed');
        }

        // Document complexity
        const wordCount = analysisResults?.metadata?.wordCount || 0;
        if (wordCount > 2000) {
            keyPoints.push('Document is comprehensive with detailed information');
        } else if (wordCount > 500) {
            keyPoints.push('Document provides moderate level of detail');
        } else {
            keyPoints.push('Document is brief and may lack necessary details');
        }

        // Generate recommendations
        const recommendations = [
            'Compare pricing with industry benchmarks to ensure competitive rates',
            'Verify product specifications against your requirements',
            'Request additional documentation for missing information',
            'Confirm delivery and implementation timeframes before proceeding'
        ];

        if (docType.toLowerCase().includes('proposal') || docType.toLowerCase().includes('quote')) {
            recommendations.push('Evaluate the proposal against competitive offerings');
            recommendations.push('Check warranty terms and support conditions');
        }

        if (docType.toLowerCase().includes('contract')) {
            recommendations.push('Have legal team review terms and conditions');
            recommendations.push('Ensure SLA terms meet business requirements');
        }

        // Generate next steps
        let nextSteps = '';

        if (prices.length > 0 && vendors.length > 0) {
            nextSteps = `Schedule meeting with ${vendors[0]} to discuss pricing and specifications`;
        } else if (vendors.length > 0) {
            nextSteps = `Contact ${vendors[0]} for more information`;
        } else {
            nextSteps = 'Gather additional vendor information and specifications';
        }

        // Construct a prompt for Bedrock agent
        const prompt = `
        Generate actionable business insights for a document with the following details:

        Document Type: ${docType}
        Document ID: ${documentId}
        File Type: ${fileType}
        Sentiment: ${sentiment}

        Key Findings: ${JSON.stringify(keyFindings)}

        Entities:
        - Vendors: ${JSON.stringify(vendors)}
        - Products: ${JSON.stringify(products)}
        - Prices: ${JSON.stringify(prices)}

        Please provide:
        1. A concise summary of the document
        2. Key points to consider
        3. Specific recommendations based on the document content
        4. Suggested next steps
        `;

        // Call Bedrock agent to generate insights
        const bedrockResponse = await invokeBedrockAgent(prompt, documentId, {
            region: process.env.AWS_REGION,
            agentId: process.env.BEDROCK_AGENT_ID,
            agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID
        });

        // Parse Bedrock response
        let bedrockInsights = {};
        try {
            if (bedrockResponse && bedrockResponse.completion) {
                // Log the raw completion from Bedrock for debugging
                console.log('Bedrock raw completion:', bedrockResponse.completion);

                // Try to parse structured data if available
                try {
                    bedrockInsights = JSON.parse(bedrockResponse.completion);
                } catch (parseError) {
                    // If not JSON, use the text as summary
                    console.log('JSON parsing failed, using raw text as summary. Error:', parseError.message);
                    console.log('Raw text content type:', typeof bedrockResponse.completion);
                    bedrockInsights = {
                        bedrockSummary: bedrockResponse.completion
                    };
                }
            } else {
                console.log('Bedrock response missing or has no completion property:', bedrockResponse);
            }
        } catch (parseError) {
            console.warn('Error parsing Bedrock response:', parseError);
            console.log('Bedrock response that caused error:', JSON.stringify(bedrockResponse, null, 2));
        }

        // Prepare insights object, combining rule-based and Bedrock insights
        const insights = {
            summary: bedrockInsights.summary || summary,
            keyPoints: bedrockInsights.keyPoints || keyPoints,
            recommendations: bedrockInsights.recommendations || recommendations,
            nextSteps: bedrockInsights.nextSteps || nextSteps,
            bedrockInsights: bedrockResponse?.completion ? bedrockResponse.completion : null,
            sourceDocument: {
                type: fileType,
                documentId
            }
        };

        // Add comparative analysis if available
        if (comparisonResults) {
            insights.comparativeAnalysis = {
                bestOption: comparisonResults.recommendation || 'Further analysis needed to determine best option',
                keyDifferences: comparisonResults.differences || [],
                similarities: comparisonResults.similarities || []
            };
        }

        return {
            ...event,
            insights,
            insightsTimestamp: new Date().toISOString(),
            bedrockResponse: bedrockResponse || null
        };
    } catch (error) {
        console.error('Error generating insights:', error);

        // Return basic insights to allow workflow to continue
        return {
            ...event,
            insights: {
                summary: 'Error generating detailed insights',
                keyPoints: ['Document processing encountered some issues', 'Basic analysis was completed', 'Manual review recommended'],
                recommendations: ['Review document manually', 'Reprocess if issues persist'],
                nextSteps: 'Contact support if problems continue'
            },
            insightsTimestamp: new Date().toISOString(),
            error: error.message
        };
    }
};
