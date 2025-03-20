// functions/document-analysis/insight-generator.js
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

        // Generate a summary
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

        // Prepare insights object
        const insights = {
            summary,
            keyPoints,
            recommendations,
            nextSteps,
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
            insightsTimestamp: new Date().toISOString()
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