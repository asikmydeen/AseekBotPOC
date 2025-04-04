// app/api/advancedApi.ts
import { CreatePromptRequest, PromptType, UpdatePromptRequest } from '../types/shared';
import { LAMBDA_ENDPOINTS, TicketDetails, ApiResponse, handleClientError } from '../utils/lambdaApi';
import normalizeS3Url from '../utils/normalizeS3Url';

function updateLocalStorageForRequest(requestId: string, state: any) {
  try {
    const stored = localStorage.getItem('pendingRequests');
    const pending = stored ? JSON.parse(stored) : {};
    pending[requestId] = state;
    localStorage.setItem('pendingRequests', JSON.stringify(pending));
  } catch (e) {
    console.error('Error updating localStorage for request', requestId, e);
  }
}

function removeLocalStorageForRequest(requestId: string) {
  try {
    const stored = localStorage.getItem('pendingRequests');
    if (!stored) return;
    const pending = JSON.parse(stored);
    delete pending[requestId];
    localStorage.setItem('pendingRequests', JSON.stringify(pending));
  } catch (e) {
    console.error('Error removing localStorage entry for request', requestId, e);
  }
}

// Placeholder for user ID - can be replaced with actual user ID when integrating with user management
const TEST_USER_ID = 'test-user';

/**
 * Sends a message to the API, supporting multiple workflows (chat, document analysis, data query)
 *
 * This is the new unified message endpoint that replaces the old processChatMessage endpoint
 *
 * @param message - The message to send
 * @param chatSessionId - The chat session ID (for conversation continuity)
 * @param files - Optional files to include with the message
 * @returns API response with requestId for status checking
 */
export async function sendMessage(
  message: string,
  chatSessionId: string,
  files?: any[]
): Promise<ApiResponse> {
  try {
    // Generate a unique chatId if none exists
    const chatId = `chat-${Date.now()}`;

    // Create the request payload
    const payload: any = {
      message,
      userId: TEST_USER_ID,
      sessionId: chatSessionId,
      chatId: chatId
    };

    // Add S3 file references if files are present
    if (files && files.length > 0) {
      const s3Files = files.map(file => ({
        name: file.name,
        s3Url: normalizeS3Url(file.url || file.fileUrl),
        mimeType: file.type || 'application/octet-stream'
      }));

      payload.s3Files = s3Files;

      // If files are present and message suggests analysis, mark as document analysis
      if (message.toLowerCase().includes('analyze') ||
        message.toLowerCase().includes('extract') ||
        message.toLowerCase().includes('summarize')) {
        payload.documentAnalysis = true;
      }
    }

    // Use the new simplified endpoint
    const response = await fetch(LAMBDA_ENDPOINTS.message, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await response.json();

    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Checks the status of a request
 *
 * @param requestId - The ID of the request to check
 * @returns The current status of the request
 */
export async function checkStatus(requestId: string): Promise<ApiResponse> {
  try {
    if (!requestId) {
      throw new Error('No requestId provided');
    }

    const response = await fetch(`${LAMBDA_ENDPOINTS.status}/${requestId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check status');
    }

    const data = await response.json();

    // Update localStorage based on response status
    if (data.status === 'QUEUED' || data.status === 'PROCESSING') {
      updateLocalStorageForRequest(requestId, data);
    } else if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      removeLocalStorageForRequest(requestId);
    }
    return data;
  } catch (error) {
    console.error(`Error checking status for ${requestId}:`, error);
    throw error;
  }
}

/**
 * Gets a summary of all requests in a session
 *
 * @param sessionId - The session ID to summarize
 * @returns Summary of all requests in the session
 */
export async function getSessionSummary(sessionId: string): Promise<ApiResponse> {
  try {
    if (!sessionId) {
      throw new Error('No sessionId provided');
    }

    const response = await fetch(`${LAMBDA_ENDPOINTS.status}/summary?sessionId=${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

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

/**
 * Gets chat history
 *
 * @param chatId - The chat ID to get history for
 * @returns Chat history
 */
export async function getChatHistory(chatId: string): Promise<ApiResponse> {
  try {
    if (!chatId) {
      throw new Error('No chatId provided');
    }

    const response = await fetch(`${LAMBDA_ENDPOINTS.status}/history?chatId=${chatId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get chat history');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting chat history for ${chatId}:`, error);
    throw error;
  }
}

// File upload function - kept as is since it still uses the same endpoint
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

    formData.append('userId', TEST_USER_ID);

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
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to upload file',
      url: '',
      chatId: 'uploadFile-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

// Create ticket function - kept as is
export async function createTicketApi(ticketDetails: TicketDetails): Promise<ApiResponse> {
  try {
    if (!ticketDetails || !ticketDetails.subject) {
      throw new Error('Invalid ticket details');
    }

    const ticketWithUser = {
      ...ticketDetails,
      userId: TEST_USER_ID
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
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to create support ticket',
      url: '',
      chatId: 'createTicket-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

// Helper function to extract S3 key from a file URL
function extractS3KeyFromUrl(fileUrl: string): string {
  if (!fileUrl) {
    throw new Error('Invalid file URL');
  }

  if (fileUrl.includes('amazonaws.com/')) {
    const s3Key = fileUrl.split('amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL format');
    }
    return s3Key;
  } else if (fileUrl.includes('/')) {
    return fileUrl;
  } else {
    return fileUrl;
  }
}

export async function deleteFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const s3Key = extractS3KeyFromUrl(fileUrl);

    const response = await fetch(LAMBDA_ENDPOINTS.deleteFile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key, userId: TEST_USER_ID })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to delete file',
      url: '',
      chatId: 'deleteFile-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export async function downloadFileApi(fileUrlOrKey: string): Promise<ApiResponse> {
  try {
    const fileKey = fileUrlOrKey.includes('amazonaws.com/') ? extractS3KeyFromUrl(fileUrlOrKey) : fileUrlOrKey;

    const response = await fetch(LAMBDA_ENDPOINTS.downloadFile, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, userId: TEST_USER_ID })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate download link');
    }

    const data = await response.json();

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
      body: JSON.stringify({ userId: TEST_USER_ID })
    });

    // Log response details for debugging
    console.log(`getUserFilesApi response status: ${response.status}`);
    console.log(`getUserFilesApi content-type: ${response.headers.get('content-type')}`);

    // Get response as text first
    const responseText = await response.text();

    if (!response.ok) {
      console.error(`Error response from getUserFiles: ${responseText}`);

      if (responseText.trim().startsWith('{')) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || 'Failed to fetch user files');
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      }

      throw new Error(`Failed to fetch user files: ${responseText.substring(0, 100)}...`);
    }

    try {
      if (!responseText.trim()) {
        console.warn('getUserFilesApi: Empty response received');
        return {
          data: [],
          url: '',
          chatId: 'getUserFiles-default',
          error: 'Empty response received.',
          timestamp: Date.now().toString(),
          suggestions: [],
          multimedia: { type: 'image', data: { url: '', alt: 'File preview' } },
          report: undefined
        };
      }

      const parsedResponse = JSON.parse(responseText);
      const filesData = Array.isArray(parsedResponse.data)
        ? parsedResponse.data
        : (parsedResponse.data ? [parsedResponse.data] : []);

      // Extract multimedia from response or create default
      let multimediaObject;
      if (Array.isArray(parsedResponse.multimedia) && parsedResponse.multimedia.length > 0) {
        // Take the first item from the array
        multimediaObject = parsedResponse.multimedia[0];
      } else if (parsedResponse.multimedia && typeof parsedResponse.multimedia === 'object') {
        // If it's already an object, use it directly
        multimediaObject = parsedResponse.multimedia;
      } else {
        // Default multimedia object
        multimediaObject = { type: 'image', data: { url: '', alt: '' } };
      }

      return {
        ...parsedResponse,
        data: filesData,
        url: parsedResponse.url || '',
        chatId: parsedResponse.chatId || 'getUserFiles-success',
        timestamp: parsedResponse.timestamp || Date.now().toString(),
        suggestions: parsedResponse.suggestions || [],
        multimedia: multimediaObject,
        report: parsedResponse.report || undefined
      };
    } catch (parseError) {
      console.error('Failed to parse successful response as JSON:', parseError);
      console.error('Response preview:', responseText.substring(0, 100));
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        data: [],
        error: `Failed to parse successful response as JSON: ${errorMessage}`,
        url: '',
        chatId: 'getUserFiles-parseError',
        timestamp: Date.now().toString(),
        suggestions: [],
        multimedia: { type: 'image', data: { url: '', alt: '' } },
        report: undefined
      };
    }
  } catch (error) {
    console.error('Error in getUserFilesApi:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error fetching user files',
      url: '',
      chatId: 'getUserFiles-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: { type: 'image', data: { url: '', alt: '' } },
      report: undefined
    };
  }

}

// Update these functions to match your other working API calls

export async function getPromptsApi(filters?: {
  type?: PromptType;
  tag?: string;
  onlyMine?: boolean;
}): Promise<ApiResponse> {
  try {
    // Construct query parameters
    const queryParams = new URLSearchParams();
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.tag) queryParams.append('tag', filters.tag);
    if (filters?.onlyMine) queryParams.append('onlyMine', 'true');

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Changed to POST with userId in body to match other endpoints
    const response = await fetch(`${LAMBDA_ENDPOINTS.getPrompts}${queryString}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });

    // Log response details for debugging
    console.log(`getPromptsApi response status: ${response.status}`);
    console.log(`getPromptsApi content-type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get prompts');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error getting prompts:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch prompts',
      url: '',
      chatId: 'getPrompts-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export async function getPromptByIdApi(promptId: string): Promise<ApiResponse> {
  try {
    // Changed to POST with userId in body to match other endpoints
    const response = await fetch(LAMBDA_ENDPOINTS.getPromptById.replace(':id', promptId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get prompt');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error getting prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : `Failed to fetch prompt ${promptId}`,
      url: '',
      chatId: 'getPromptById-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export async function createPromptApi(promptData: CreatePromptRequest): Promise<ApiResponse> {
  try {
    // Add userId to the request body instead of in headers
    const requestData = {
      ...promptData,
      userId: TEST_USER_ID
    };

    const response = await fetch(LAMBDA_ENDPOINTS.createPrompt, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create prompt');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating prompt:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to create prompt',
      url: '',
      chatId: 'createPrompt-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export async function updatePromptApi(promptId: string, promptData: UpdatePromptRequest): Promise<ApiResponse> {
  try {
    // Add userId to the request body instead of in headers
    const requestData = {
      ...promptData,
      userId: TEST_USER_ID
    };

    const response = await fetch(LAMBDA_ENDPOINTS.updatePrompt.replace(':id', promptId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update prompt');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to update prompt',
      url: '',
      chatId: 'updatePrompt-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export async function deletePromptApi(promptId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(LAMBDA_ENDPOINTS.deletePrompt.replace(':id', promptId), {
      method: 'DELETE',  // Changed from POST to DELETE
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: TEST_USER_ID })  // Keep userId in body for consistency
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete prompt');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error deleting prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to delete prompt',
      url: '',
      chatId: 'deletePrompt-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

export const processChatMessage = sendMessage;export const startAsyncChatProcessing = sendMessage;
export const startAsyncDocumentAnalysis = sendMessage;
