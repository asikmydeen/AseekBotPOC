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
  attachments?: any[]
): Promise<ApiResponse> {
  try {
    // Check if we should use the new async API for better handling
   // Check if we should use the new async API for better handling
if (message.length > 500 || (attachments && attachments.length > 0)) {
  // If there are attachments, use document analysis workflow
  if (attachments && attachments.length > 0) {
    return await startAsyncDocumentAnalysis(attachments, message);
  } else {
    // Just a long message with no attachments, use regular async processing
    return await startAsyncChatProcessing(message, history);
  }
}

    // Original implementation for simpler requests
    const payload: any = {
      message: message,
      history: history,
      sessionId: `session-${Date.now()}`
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

// New async processing functions
export async function startAsyncChatProcessing(
  message: string,
  history: ChatHistoryItem[] = [],
  attachments?: any[]
): Promise<ApiResponse> {
  try {
    const sessionId = `session-${Date.now()}`;

    // Create the request payload
    const payload: any = {
      message,
      sessionId,
      history
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
  files: any[],
  message: string = 'Please analyze these documents'
): Promise<ApiResponse> {
  try {
    if (!files || !files.length) {
      throw new Error('No files provided for analysis');
    }

    const sessionId = `session-${Date.now()}`;

    // Create the request payload
    const payload: any = {
      message,
      sessionId,
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
export async function uploadFileApi(file: File, sessionId?: string): Promise<ApiResponse> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

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

    const response = await fetch(LAMBDA_ENDPOINTS.createTicket, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketDetails),
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
      body: JSON.stringify({ action, parameter }),
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

export async function deleteFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const s3Key = fileUrl.split('.amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL');
    }

    const response = await fetch(LAMBDA_ENDPOINTS.deleteFile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key })
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