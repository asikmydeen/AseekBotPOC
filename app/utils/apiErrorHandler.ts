import { NextResponse } from 'next/server';

/**
 * Interface for standardized error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
  suggestions?: string[];
}

/**
 * Handles API errors and returns standardized NextResponse objects
 * @param error - The error object caught in the API route
 * @returns NextResponse with appropriate status code and error details
 */
export function handleApiError(error: unknown): NextResponse {
  const errorObj = error as Error;
  const errorMessage = errorObj.message || 'Unknown error occurred';
  
  // S3 and permission related errors
  if (
    errorMessage.includes('S3') ||
    errorMessage.includes('AccessDenied') ||
    errorMessage.includes('Unable to download') ||
    errorMessage.includes('access denied')
  ) {
    return NextResponse.json(
      {
        error: 'File access error',
        message: 'Unable to access the uploaded file(s)',
        details: errorMessage,
        suggestions: [
          'Verify that the S3 bucket permissions are correctly configured',
          'Check that the file exists in the specified location',
          'Ensure the Bedrock agent has the necessary IAM permissions to access the S3 bucket'
        ]
      } as ErrorResponse,
      { status: 403 }
    );
  }

  // Bedrock timeout or dependency errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('DependencyFailedException') ||
    errorMessage.includes('Try the request again') ||
    errorMessage.includes('service is currently unavailable')
  ) {
    return NextResponse.json(
      {
        error: 'Service temporarily unavailable',
        message: 'The AI service is currently experiencing high load or temporary issues',
        details: errorMessage,
        suggestions: [
          'Please try your request again in a few moments',
          'Consider simplifying your query or breaking it into smaller parts',
          'If you uploaded a large file, try with a smaller file'
        ]
      } as ErrorResponse,
      { status: 503 }
    );
  }

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('malformed') ||
    errorMessage.includes('required')
  ) {
    return NextResponse.json(
      {
        error: 'Invalid request',
        message: 'The request contains invalid parameters or formatting',
        details: errorMessage,
        suggestions: [
          'Check the format of your request',
          'Ensure all required parameters are provided correctly',
          'Verify that file references are properly formatted'
        ]
      } as ErrorResponse,
      { status: 400 }
    );
  }

  // Missing required fields
  if (
    errorMessage.includes('is required') ||
    errorMessage.includes('missing')
  ) {
    return NextResponse.json(
      {
        error: 'Missing required field',
        message: 'A required field is missing from your request',
        details: errorMessage,
        suggestions: [
          'Check that all required fields are included in your request',
          'Verify the spelling of parameter names'
        ]
      } as ErrorResponse,
      { status: 400 }
    );
  }

  // Authentication errors
  if (
    errorMessage.includes('authentication') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('not authorized') ||
    errorMessage.includes('forbidden')
  ) {
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: 'You are not authorized to perform this action',
        details: errorMessage,
        suggestions: [
          'Check your authentication credentials',
          'Verify that you have the necessary permissions'
        ]
      } as ErrorResponse,
      { status: 401 }
    );
  }

  // Generic catch-all for other errors
  return NextResponse.json(
    {
      error: 'Failed to process request',
      message: 'An unexpected error occurred while processing your request',
      details: errorMessage,
      suggestions: [
        'Try your request again',
        'If the problem persists, contact support with the error details'
      ]
    } as ErrorResponse,
    { status: 500 }
  );
}