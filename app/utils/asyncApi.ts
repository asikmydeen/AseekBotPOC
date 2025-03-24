import { LAMBDA_ENDPOINTS } from './lambdaApi';

export interface AsyncRequestOptions {
  sessionId?: string;
  history?: any[];
  attachments?: any[];
}

export interface StatusResponse {
  requestId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message?: string;
  progress: number;
  result?: any;
  error?: {
    message: string;
    name: string;
  };
  timestamp: string;
  updatedAt?: string;
  stepFunctionsExecution?: {
    executionArn: string;
    startTime: string;
  };
}

/**
 * Start async processing of a chat message
 */
export async function startChatProcessing(
  message: string,
  options: AsyncRequestOptions = {}
): Promise<StatusResponse> {
  try {
    const { sessionId, history, attachments } = options;

    // Create the request payload
    const payload: any = {
      message,
      sessionId: sessionId || `session-${Date.now()}`,
      history: history || []
    };

    // Add S3 file references if attachments are present
    if (attachments && attachments.length > 0) {
      // Map file objects to the format expected by the API
      const s3Files = attachments.map(file => ({
        name: file.name,
        s3Url: file.url || file.fileUrl,
        mimeType: file.type || 'application/octet-stream',
        useCase: "CHAT"
      }));

      payload.s3Files = s3Files;
    }

    // Call the Lambda API endpoint
    const response = await fetch(LAMBDA_ENDPOINTS.startProcessing, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start processing');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting chat processing:', error);
    throw error;
  }
}

/**
 * Start async document analysis
 */
export async function startDocumentAnalysis(
  files: any[],
  message: string = 'Please analyze these documents',
  options: AsyncRequestOptions = {}
): Promise<StatusResponse> {
  try {
    if (!files || !files.length) {
      throw new Error('No files provided for analysis');
    }

    const { sessionId } = options;

    // Create the request payload with RequestType hint for document analysis
    const payload: any = {
      message,
      sessionId: sessionId || `session-${Date.now()}`,
      s3Files: files.map(file => ({
        name: file.name,
        s3Url: file.url || file.fileUrl,
        mimeType: file.type || 'application/octet-stream',
        useCase: 'DOCUMENT_ANALYSIS'
      })),
      requestType: 'DOCUMENT_ANALYSIS'
    };

    // Call the Lambda API endpoint
    const response = await fetch(LAMBDA_ENDPOINTS.startProcessing, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start document analysis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting document analysis:', error);
    throw error;
  }
}

/**
 * Check the status of an async request
 */
export async function checkStatus(requestId: string): Promise<StatusResponse> {
  try {
    const response = await fetch(`${LAMBDA_ENDPOINTS.checkStatus}/${requestId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check status');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error checking status for request ${requestId}:`, error);
    throw error;
  }
}

/**
 * Get status summary for a session
 */
export async function getSessionSummary(sessionId: string): Promise<StatusResponse[]> {
  try {
    const response = await fetch(`${LAMBDA_ENDPOINTS.checkStatus}/summary?sessionId=${sessionId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get session summary');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting session summary for ${sessionId}:`, error);
    throw error;
  }
}