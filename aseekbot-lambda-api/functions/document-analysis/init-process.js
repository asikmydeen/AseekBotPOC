exports.handler = async (event) => {
  console.log('Initializing document analysis process', JSON.stringify(event, null, 2));

  // Ensure all input parameters are passed through
  return {
    ...event,
    processId: `process-${Date.now()}`,
    startTime: new Date().toISOString(),
    s3Bucket: event.s3Bucket,
    s3Key: event.s3Key,
    fileType: event.fileType,
    documentId: event.documentId,
    userId: event.userId
  };
};