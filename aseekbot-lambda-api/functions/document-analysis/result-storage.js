// functions/document-analysis/result-storage.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client();

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

        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: JSON.stringify(fullResults, null, 2),
            ContentType: 'application/json'
        }));

        // Store summary in DynamoDB
        await docClient.send(new PutCommand({
            TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
            Item: {
                documentId,
                userId,
                status: 'COMPLETED',
                timestamp: new Date().toISOString(),
                summary: insights.summary,
                resultLocation: s3Key
            }
        }));

        return {
            ...event,
            resultLocation: s3Key
        };
    } catch (error) {
        console.error('Error storing results:', error);
        throw error;
    }
};