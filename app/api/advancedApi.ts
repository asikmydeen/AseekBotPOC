// app/api/advancedApi.ts
import {
  LAMBDA_ENDPOINTS,
  ChatHistoryItem,
  TicketDetails,
  ApiResponse,
  handleClientError
} from '../utils/lambdaApi';

// Original API functions
export async function processChatMessage(
message: string,
history: ChatHistoryItem[],
attachments?: any[],
chatSessionId?: string): Promise<ApiResponse> {
  try {
    // Check if we should use the new async API for better handling
    if (message.length > 500 || (attachments && attachments.length > 0)) {
      // If there are attachments, use document analysis workflow
      if (attachments && attachments.length > 0) {
        return await startAsyncDocumentAnalysis(attachments, message, chatSessionId || '');
      } else {
        // Just a long message with no attachments, use regular async processing
        return await startAsyncChatProcessing(message, history, undefined, chatSessionId || '');
      }
    }

    // Use the provided chatSessionId or create a new one if none exists
    const sessionId = chatSessionId || `session-${Date.now()}`;

    // Original implementation for simpler requests
    const payload: any = {
      message: message,
      history: history,
      sessionId: sessionId, // Use the existing or new session ID
      userId: 'test-user'
    };

    // Add S3 file references if attachments are present
    if (attachments && attachments.length > 0) {
      const s3Files = attachments.map(file => ({
        name: file.name,
        s3Url: file.url || file.fileUrl,
        mimeType: file.type || 'application/octet-stream',
        useCase: "CHAT"
      }));

      payload.s3Files = s3Files;
    }

    const response = await fetch(LAMBDA_ENDPOINTS.processChatMessage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process chat message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in processChatMessage:', error);
    throw error;
  }
}

export async function startAsyncChatProcessing(
message: string, history: ChatHistoryItem[] = [], attachments?: any[], chatSessionId?: string): Promise<ApiResponse> {
  try {
    const sessionId = `session-${Date.now()}`;

    // Create the request payload
    const payload: any = {
      message,
      sessionId,
      history,
      userId: 'test-user'
    };

    // Add S3 file references if attachments are present
    if (attachments && attachments.length > 0) {
      const s3Files = attachments.map(file => ({
        name: file.name,
        s3Url: file.url || file.fileUrl,
        mimeType: file.type || 'application/octet-stream',
        useCase: "CHAT"
      }));

      payload.s3Files = s3Files;
    }

    const response = await fetch(LAMBDA_ENDPOINTS.startProcessing, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start processing');
    }

    const result = await response.json();

    // Add a flag to indicate this is an async request
    return {
      ...result,
      isAsync: true
    };
  } catch (error) {
    console.error('Error starting async chat processing:', error);
    throw error;
  }
}

export async function startAsyncDocumentAnalysis(
files: any[], message: string = 'Please analyze these documents', chatSessionId: string): Promise<ApiResponse> {
  try {
    if (!files || !files.length) {
      throw new Error('No files provided for analysis');
    }

    const sessionId = `session-${Date.now()}`;

    // Create the request payload
    const payload: any = {
      message,
      sessionId,
      userId: 'test-user',
      s3Files: files.map(file => ({
        name: file.name,
        s3Url: file.url || file.fileUrl,
        mimeType: file.type || 'application/octet-stream',
        useCase: "CODE_INTERPRETER"  // Changed from DOCUMENT_ANALYSIS
      })),
      documentAnalysis: true  // This is crucial for the backend to identify it as document analysis
    };

    const response = await fetch(LAMBDA_ENDPOINTS.startProcessing, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start document analysis');
    }

    const result = await response.json();

    // Add a flag to indicate this is an async request
    return {
      ...result,
      isAsync: true,
      isDocumentAnalysis: true
    };
  } catch (error) {
    console.error('Error starting async document analysis:', error);
    throw error;
  }
}

export async function checkRequestStatus(requestId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`${LAMBDA_ENDPOINTS.checkStatus}/status/${requestId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check request status');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error checking status for request ${requestId}:`, error);
    throw error;
  }
}

// Existing API functions with minimal changes
export async function uploadFileApi(file: File, sessionId?: string, p0?: string): Promise<ApiResponse> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    formData.append('userId', 'test-user');

    const response = await fetch(LAMBDA_ENDPOINTS.uploadFile, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }

    return await response.json();
  } catch (error) {
    handleClientError(error, 'upload file');
  }
}

export async function createTicketApi(ticketDetails: TicketDetails): Promise<ApiResponse> {
  try {
    if (!ticketDetails || !ticketDetails.subject) {
      throw new Error('Invalid ticket details');
    }

    // Add userId to the ticket details
    const ticketWithUser = {
      ...ticketDetails,
      userId: 'test-user'
    };

    const response = await fetch(LAMBDA_ENDPOINTS.createTicket, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketWithUser),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create support ticket');
    }

    return await response.json();
  } catch (error) {
    handleClientError(error, 'create support ticket');
  }
}

export async function quickLinkApi(action: string, parameter: string): Promise<ApiResponse> {
  try {
    if (!action) {
      throw new Error('No action specified');
    }

    const response = await fetch(LAMBDA_ENDPOINTS.quickLink, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, parameter, userId: 'test-user' }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process quick link action');
    }

    return await response.json();
  } catch (error) {
    handleClientError(error, 'process quick link action');
  }
}

// Helper function to extract S3 key from a file URL
function extractS3KeyFromUrl(fileUrl: string): string {
  if (!fileUrl) {
    throw new Error('Invalid file URL');
  }

  // Handle standard S3 URL format: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
  if (fileUrl.includes('amazonaws.com/')) {
    const s3Key = fileUrl.split('amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL format');
    }
    return s3Key;
  }
  // Fallback if it's already a partial path
  else if (fileUrl.includes('/')) {
    return fileUrl;
  }
  // If it's just the key itself
  else {
    return fileUrl;
  }
}

export async function deleteFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const s3Key = fileUrl.split('.amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL');
    }

    const response = await fetch(LAMBDA_ENDPOINTS.deleteFile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key, userId: 'test-user' })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    handleClientError(error, 'delete file');
  }
}

export async function downloadFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const fileKey = extractS3KeyFromUrl(fileUrl);

    const response = await fetch(LAMBDA_ENDPOINTS.downloadFile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, userId: 'test-user' })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate download link');
    }

    const data = await response.json();

    // Handle different response formats
    return {
      fileUrl: data.url || data.fileUrl || (typeof data === 'string' ? data : null),
      ...data
    };
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

export async function getUserFilesApi(): Promise<ApiResponse> {
  try {
    const response = await fetch(LAMBDA_ENDPOINTS.getUserFiles, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user' })
    });

    // Log response details for debugging
    console.log(`getUserFilesApi response status: ${response.status}`);
    console.log(`getUserFilesApi content-type: ${response.headers.get('content-type')}`);

    // Get response as text first
    const responseText = await response.text();

    // Handle non-OK responses
    if (!response.ok) {
      console.error(`Error response from getUserFiles: ${responseText}`);

      // Try to parse as JSON if it looks like JSON
      if (responseText.trim().startsWith('{')) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to fetch user files');
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      }

      // If we couldn't parse as JSON or it's not JSON, throw with the text
      throw new Error(`Failed to fetch user files: ${responseText.substring(0, 100)}...`);
    }

    // For successful responses, try to parse as JSON
    try {
      if (!responseText.trim()) {
        console.warn('getUserFilesApi: Empty response received');
        return {
          data: [],
          url: '',
          chatId: 'getUserFiles-default',
          error: 'Empty response received.'
        };
      }

      const parsedResponse = JSON.parse(responseText);
      // Ensure data is always an array
      const filesData = Array.isArray(parsedResponse.data)
        ? parsedResponse.data
        : (parsedResponse.data ? [parsedResponse.data] : []);

      // Ensure the response has all required ApiResponse properties
      return {
        ...parsedResponse,
        data: filesData,
        url: parsedResponse.url || '',
        chatId: parsedResponse.chatId || 'getUserFiles-success'
      };
    } catch (parseError) {
      console.error('Failed to parse successful response as JSON:', parseError);
      console.error('Response preview:', responseText.substring(0, 100));
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        data: [],
        error: `Failed to parse successful response as JSON: ${errorMessage}`,
        url: '',
        chatId: 'getUserFiles-parseError'
      };
    }
  } catch (error) {
    console.error('Error in getUserFilesApi:', error);
    // Return a default object instead of throwing to avoid breaking the UI
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching user files',
      url: '',
      chatId: 'getUserFiles-error'
    };
  }
}
