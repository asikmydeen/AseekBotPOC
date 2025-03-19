// In aseekbot-lambda-api/lambdas/startDocumentAnalysis.js
const AWS = require('aws-sdk');
const stepfunctions = new AWS.StepFunctions();

exports.handler = async (event) => {
  const { s3Bucket, s3Key, fileType, userId } = JSON.parse(event.body);

  const params = {
    stateMachineArn: process.env.DOCUMENT_ANALYSIS_STATE_MACHINE_ARN,
    input: JSON.stringify({
      documentId: `doc-${Date.now()}`,
      userId,
      s3Bucket,
      s3Key,
      fileType,
      isMultipleDocuments: false
    })
  };

  try {
    const execution = await stepfunctions.startExecution(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        executionArn: execution.executionArn,
        documentId: JSON.parse(params.input).documentId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to start document analysis',
        details: error.message
      })
    };
  }
};