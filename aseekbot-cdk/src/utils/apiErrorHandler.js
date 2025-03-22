function handleApiError(error) {
  const errorObj = error instanceof Error ? error : new Error('Unknown error');
  const errorMessage = errorObj.message || 'Unknown error occurred';
  
  // S3 and permission related errors
  if (
    errorMessage.includes('S3') ||
    errorMessage.includes('AccessDenied') ||
    errorMessage.includes('Unable to download') ||
    errorMessage.includes('access denied')
  ) {
    return {
      status: 403,
      body: {
        error: 'File access error',
        message: 'Unable to access the uploaded file(s)',
        details: errorMessage,
        suggestions: [
          'Verify that the S3 bucket permissions are correctly configured',
          'Check that the file exists in the specified location',
          'Ensure the Bedrock agent has the necessary IAM permissions to access the S3 bucket'
        ]
      }
    };
  }

  // Bedrock timeout or dependency errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('DependencyFailedException') ||
    errorMessage.includes('Try the request again') ||
    errorMessage.includes('service is currently unavailable')
  ) {
    return {
      status: 503,
      body: {
        error: 'Service temporarily unavailable',
        message: 'The AI service is currently experiencing high load or temporary issues',
        details: errorMessage,
        suggestions: [
          'Please try your request again in a few moments',
          'Consider simplifying your query or breaking it into smaller parts',
          'If you uploaded a large file, try with a smaller file'
        ]
      }
    };
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('malformed') ||
    errorMessage.includes('required')
  ) {
    return {
      status: 400,
      body: {
        error: 'Invalid request',
        message: 'The request contains invalid parameters or formatting',
        details: errorMessage,
        suggestions: [
          'Check the format of your request',
          'Ensure all required parameters are provided correctly',
          'Verify that file references are properly formatted'
        ]
      }
    };
  }

  // Generic catch-all for other errors
  return {
    status: 500,
    body: {
      error: 'Failed to process request',
      message: 'An unexpected error occurred while processing your request',
      details: errorMessage,
      suggestions: [
        'Try your request again',
        'If the problem persists, contact support with the error details'
      ]
    }
  };
}

module.exports = {
  handleApiError
};
