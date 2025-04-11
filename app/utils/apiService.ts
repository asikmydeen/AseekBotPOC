// app/utils/apiService.ts
import { useApiStore } from '../store/apiStore';
import { LAMBDA_ENDPOINTS } from './lambdaApi';
import { getCurrentUserId } from '../store/userStore';

/**
 * Extracts the S3 key from a file URL
 */
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
  // Handle CloudFront or custom domain URLs
  else if (fileUrl.includes('/') && !fileUrl.startsWith('http')) {
    // Assume it's already a partial path or key
    return fileUrl;
  }
  // Handle simple key
  else {
    return fileUrl;
  }
}

// Placeholder for auth token - can be replaced with actual values when integrating with user management
export const API_KEY = 'aseekbot-dev-key'; // This is a placeholder API key

// Generate a unique request ID
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

/**
 * Makes an API request and updates the API store
 *
 * @param url - The URL to make the request to
 * @param method - The HTTP method to use
 * @param body - The request body (for POST, PUT, etc.)
 * @param options - Additional fetch options
 * @returns A promise that resolves to the response data
 */
export async function makeRequest<T = any>(
  url: string,
  method: string = 'GET',
  body?: any,
  options: RequestInit = {}
): Promise<T> {
  const requestId = generateRequestId();
  const { startRequest, setResponse, setError } = useApiStore.getState();

  // Start the request in the store
  startRequest(requestId, url, method, body);

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'X-User-ID': getCurrentUserId(),
      ...options.headers,
    };

    // Prepare the request options
    const requestOptions: RequestInit = {
      method,
      headers,
      mode: 'cors', // Add CORS mode explicitly
      credentials: 'include', // Include credentials like cookies
      ...options,
    };

    // Add the body if it exists
    if (body) {
      if (body instanceof FormData) {
        // Don't set Content-Type for FormData, browser will set it with boundary
        delete (requestOptions.headers as any)['Content-Type'];
        requestOptions.body = body;
      } else {
        // Make sure body is properly stringified JSON
        requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    console.log(`Making ${method} request to ${url}`, { body, requestOptions });

    // Make the request
    const response = await fetch(url, requestOptions);

    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      // Try to parse as JSON anyway if it looks like JSON
      if (typeof data === 'string' && data.trim().startsWith('{')) {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // If it fails to parse, keep it as text
          console.warn('Failed to parse response as JSON:', e);
        }
      }
    }

    console.log(`Response from ${url}:`, { status: response.status, data });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorMessage = data.error || data.message || 'An error occurred';
      setError(requestId, errorMessage, response.status.toString());
      throw new Error(errorMessage);
    }

    // Update the store with the successful response
    setResponse(requestId, data, response.status);

    return data as T;
  } catch (error) {
    // Handle any errors
    console.error('API request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    setError(requestId, errorMessage);
    throw error;
  }
}

/**
 * API service with methods for common endpoints
 */
export const apiService = {
  /**
   * Sends a message to the chat API
   * @param messageOrOptions - Either a string message or an options object with message details
   * @param chatSessionId - The chat session ID (only used if messageOrOptions is a string)
   * @param files - Optional files to attach (only used if messageOrOptions is a string)
   */
  sendMessage: async (messageOrOptions: string | {
    promptId?: string;
    message?: string;
    userId: string;
    sessionId: string;
    chatId: string;
    s3Files?: Array<{
      name: string;
      fileName: string;
      s3Url: string;
      mimeType: string;
    }>;
  }, chatSessionId?: string, files?: any[]) => {
    try {
      console.log('apiService: sendMessage called with:', {
        type: typeof messageOrOptions,
        isObject: typeof messageOrOptions === 'object',
        hasPromptId: typeof messageOrOptions === 'object' && 'promptId' in messageOrOptions,
        hasS3Files: typeof messageOrOptions === 'object' && 's3Files' in messageOrOptions,
        chatSessionId,
        hasFiles: files && files.length > 0
      });

      let payload: any;

      // Handle the case where messageOrOptions is an object (new format)
      if (typeof messageOrOptions === 'object') {
        payload = { ...messageOrOptions };
        console.log('apiService: Using object format with properties:', Object.keys(payload));

        // Ensure userId is set
        if (!payload.userId) {
          payload.userId = getCurrentUserId();
        }

        // Log s3Files if present
        if (payload.s3Files) {
          console.log('apiService: s3Files present in payload:', {
            count: payload.s3Files.length,
            files: payload.s3Files.map((f: any) => ({ name: f.name, fileName: f.fileName }))
          });
        } else {
          console.log('apiService: No s3Files in payload');
        }
      }
      // Handle the case where messageOrOptions is a string (old format)
      else {
        console.log('apiService: Using string format with message:', messageOrOptions.substring(0, 50) + '...');
        payload = {
          message: messageOrOptions,
          userId: getCurrentUserId()
        };

        // Include chatId if it exists (for continuing conversations)
        if (chatSessionId) {
          payload.chatId = chatSessionId;
          payload.sessionId = chatSessionId;
          console.log('apiService: Setting chatId and sessionId:', chatSessionId);
        }

        // Add files if they exist
        if (files && files.length > 0) {
          console.log('apiService: Adding files to payload:', files.length, 'files');
          payload.files = files.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            url: file.url || ''
          }));
        }
      }

      console.log('apiService: Sending message with payload:', payload);
      const response = await makeRequest(LAMBDA_ENDPOINTS.message, 'POST', payload);
      console.log('apiService: Message sent successfully, response:', response);
      return response;
    } catch (error) {
      console.error('apiService: Error sending message:', error);
      throw error;
    }
  },

  /**
   * Checks the status of a request
   */
  checkStatus: async (requestId: string) => {
    try {
      if (!requestId) {
        throw new Error('No requestId provided');
      }

      return await makeRequest(`${LAMBDA_ENDPOINTS.status}/${requestId}?userId=${getCurrentUserId()}`, 'GET');
    } catch (error) {
      console.error('Error checking status:', error);
      throw error;
    }
  },

  /**
   * Uploads a file to the API
   */
  uploadFile: async (file: File, sessionId?: string) => {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', getCurrentUserId());

      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      // Make the request with FormData
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
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  /**
   * Deletes a file from the API
   */
  deleteFile: async (fileUrl: string) => {
    try {
      const s3Key = extractS3KeyFromUrl(fileUrl);

      const response = await fetch(LAMBDA_ENDPOINTS.deleteFile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Key, userId: getCurrentUserId() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Downloads a file from the API
   */
  downloadFile: async (fileUrlOrKey: string) => {
    try {
      const fileKey = fileUrlOrKey.includes('amazonaws.com/')
        ? extractS3KeyFromUrl(fileUrlOrKey)
        : fileUrlOrKey;

      // Make the request directly with fetch
      const response = await fetch(LAMBDA_ENDPOINTS.downloadFile, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, userId: getCurrentUserId() })
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
  },

  /**
   * Gets all files for the current user
   */
  getUserFiles: async () => {
    try {
      const userId = getCurrentUserId();
      console.log('Fetching user files for user:', userId);

      // Make the request directly with fetch
      const response = await fetch(LAMBDA_ENDPOINTS.getUserFiles, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get user files');
      }

      const responseText = await response.text();
      console.log('getUserFiles raw response:', responseText.substring(0, 100) + '...');

      try {
        if (!responseText.trim()) {
          console.warn('getUserFiles: Empty response received');
          return [];
        }

        const parsedResponse = JSON.parse(responseText);
        console.log('getUserFiles parsed response type:', typeof parsedResponse);

        // Handle different response formats
        if (Array.isArray(parsedResponse)) {
          console.log(`getUserFiles: Found ${parsedResponse.length} files in array format`);
          return parsedResponse;
        }
        else if (parsedResponse.data && Array.isArray(parsedResponse.data)) {
          console.log(`getUserFiles: Found ${parsedResponse.data.length} files in data.array format`);
          return parsedResponse.data;
        }
        else if (parsedResponse.files && Array.isArray(parsedResponse.files)) {
          console.log(`getUserFiles: Found ${parsedResponse.files.length} files in files.array format`);
          return parsedResponse.files;
        }
        else if (parsedResponse.data) {
          console.log('getUserFiles: Found data object, converting to array');
          return [parsedResponse.data];
        }
        else {
          console.log('getUserFiles: No recognizable file data format, returning empty array');
          return [];
        }
      } catch (parseError) {
        console.error('Error parsing getUserFiles response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error getting user files:', error);
      return [];
    }
  },

  /**
   * Creates a support ticket
   */
  createTicket: async (ticketDetails: any) => {
    try {
      return await makeRequest(LAMBDA_ENDPOINTS.createTicket, 'POST', { ...ticketDetails, userId: getCurrentUserId() });
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  /**
   * Gets all prompts
   */
  getPrompts: async () => {
    try {
      return await makeRequest(`${LAMBDA_ENDPOINTS.getPrompts}?userId=${getCurrentUserId()}`, 'GET');
    } catch (error) {
      console.error('Error getting prompts:', error);
      throw error;
    }
  },

  /**
   * Gets a prompt by ID
   */
  getPromptById: async (id: string) => {
    try {
      return await makeRequest(`${LAMBDA_ENDPOINTS.getPromptById.replace(':id', id)}?userId=${getCurrentUserId()}`, 'GET');
    } catch (error) {
      console.error(`Error getting prompt ${id}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new prompt
   */
  createPrompt: async (promptData: any) => {
    try {
      return await makeRequest(LAMBDA_ENDPOINTS.createPrompt, 'POST', { ...promptData, userId: getCurrentUserId() });
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  },

  /**
   * Updates an existing prompt
   */
  updatePrompt: async (id: string, promptData: any) => {
    try {
      // Add userId to the request body
      const requestData = {
        ...promptData,
        userId: getCurrentUserId()
      };

      const response = await fetch(LAMBDA_ENDPOINTS.updatePrompt.replace(':id', id), {
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
      console.error(`Error updating prompt ${id}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a prompt
   */
  deletePrompt: async (id: string) => {
    try {
      return await makeRequest(`${LAMBDA_ENDPOINTS.deletePrompt.replace(':id', id)}?userId=${getCurrentUserId()}`, 'DELETE');
    } catch (error) {
      console.error(`Error deleting prompt ${id}:`, error);
      throw error;
    }
  },
};

/**
 * Custom hook for making API requests with automatic store integration
 *
 * @param requestFn - The function that makes the API request
 * @returns An object with the request function, loading state, data, and error
 */
export function useApiRequest<T, P extends any[]>(
  requestFn: (...args: P) => Promise<T>
) {
  const requestId = generateRequestId();
  const isLoading = useApiStore((state) => state.requests[requestId]?.status === 'pending' || false);
  const response = useApiStore((state) => state.responses[requestId]?.data as T | undefined);
  const error = useApiStore((state) => state.errors[requestId]);

  const execute = async (...args: P): Promise<T> => {
    try {
      return await requestFn(...args);
    } catch (error) {
      throw error;
    }
  };

  return {
    execute,
    isLoading,
    data: response,
    error: error?.message,
  };
}
