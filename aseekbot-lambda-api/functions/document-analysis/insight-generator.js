// functions/document-analysis/insight-generator.js
exports.handler = async (event) => {
    console.log('Generating insights', JSON.stringify(event, null, 2));

    const { analysisResults, comparisonResults = null, documentId } = event;

    try {
        // Generate insights based on analysis and optional comparison
        const insights = {
            summary: 'This document appears to be a vendor proposal for data center equipment',
            keyPoints: [
                'Pricing is within market average range',
                'Delivery timeline is acceptable for project scope',
                'Technical specifications meet requirements'
            ],
            recommendations: [
                'Verify warranty terms before proceeding',
                'Request more details on support services'
            ],
            nextSteps: 'Schedule vendor call to discuss proposal details'
        };

        // If we have comparison results, add comparative insights
        if (comparisonResults) {
            insights.comparativeAnalysis = {
                bestOption: 'Based on analysis, Document 2 offers better overall value',
                pricingDifference: '20% variation between vendors',
                qualityComparison: 'Similar quality specifications between offerings'
            };
        }

        return {
            ...event,
            insights,
            insightsTimestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error generating insights:', error);
        throw error;
    }
};