// functions/document-analysis/result-storage.js
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('Storing results', JSON.stringify(event, null, 2));

    const { insights, analysisResults, comparisonResults, documentId, userId } = event;

    try {
        // Store detailed results in S3
        const fullResults = {
            documentId,
            userId,
            timestamp: new Date().toISOString(),
            insights,
            analysisResults,
            comparisonResults,
            processingComplete: true
        };

        const s3Key = `analysis-results/${documentId}/results.json`;

        await s3.putObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: JSON.stringify(fullResults, null, 2),
            ContentType: 'application/json'
        }).promise();

        // Store summary in DynamoDB for quick access
        await dynamoDB.put({
            TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
            Item: {
                documentId,
                userId,
                status: 'COMPLETED',
                timestamp: new Date().toISOString(),
                summary: insights.summary,
                resultLocation: s3Key
            }
        }).promise();

        return {
            ...event,
            resultLocation: s3Key
        };
    } catch (error) {
        console.error('Error storing results:', error);
        throw error;
    }
};