// functions/document-analysis/document-comparer.js
exports.handler = async (event) => {
  console.log('Comparing documents', JSON.stringify(event, null, 2));

  const { documents, documentId } = event;

  try {
    // For testing, we'll simulate document comparison

    const comparisonResults = {
      similarities: [
        'Both documents mention the same hardware specifications'
      ],
      differences: [
        'Document 1 quotes a 20% higher price than Document 2',
        'Document 2 offers a shorter delivery timeline'
      ],
      recommendation: 'Document 2 appears to offer better value based on price and delivery terms'
    };

    return {
      ...event,
      comparisonResults,
      comparisonTimestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error comparing documents:', error);
    throw error;
  }
};