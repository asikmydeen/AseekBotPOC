exports.handler = async (event) => {
  console.log('Initializing document analysis process', JSON.stringify(event, null, 2));

  // Extract the input data
  const inputData = event.input || {};

  // Return all fields at the top level for easy access in Step Functions
  return {
    documentId: inputData.documentId,
    userId: inputData.userId,
    s3Bucket: inputData.s3Bucket,
    s3Key: inputData.s3Key,
    fileType: inputData.fileType,
    isMultipleDocuments: inputData.isMultipleDocuments || false,
    processId: `process-${Date.now()}`,
    startTime: new Date().toISOString()
  };
};