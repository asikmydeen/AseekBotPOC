// app/utils/apiService.ts
import { useApiStore } from '../store/apiStore';
import { LAMBDA_ENDPOINTS } from './lambdaApi';

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

// Placeholder for user ID and auth token - can be replaced with actual values when integrating with user management
export const TEST_USER_ID = 'test-user';
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
      'X-User-ID': TEST_USER_ID,
      ...options.headers,
    };

    // Prepare the request options
    const requestOptions: RequestInit = {
      method,
      headers,
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
   */
  sendMessage: async (message: string, chatSessionId: string, files?: any[]) => {
    try {
      // Create JSON payload
      const payload: any = {
        message,
        userId: TEST_USER_ID
      };

      // Include chatId if it exists (for continuing conversations)
      if (chatSessionId) {
        payload.chatId = chatSessionId;
      }

      // Add files if they exist
      if (files && files.length > 0) {
        payload.files = files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url || ''
        }));
      }

      return await makeRequest(LAMBDA_ENDPOINTS.message, 'POST', payload);
    } catch (error) {
      console.error('Error sending message:', error);
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

      return await makeRequest(`${LAMBDA_ENDPOINTS.status}/${requestId}?userId=${TEST_USER_ID}`, 'GET');
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
      formData.append('userId', TEST_USER_ID);

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
        body: JSON.stringify({ s3Key, userId: TEST_USER_ID })
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
  },

  /**
   * Gets all files for the current user
   */
  getUserFiles: async () => {
    try {
      // Make the request directly with fetch
      const response = await fetch(LAMBDA_ENDPOINTS.getUserFiles, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: TEST_USER_ID })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get user files');
      }

      const responseText = await response.text();

      try {
        if (!responseText.trim()) {
          console.warn('getUserFiles: Empty response received');
          return {
            data: [],
            url: '',
            error: 'Empty response received.'
          };
        }

        const parsedResponse = JSON.parse(responseText);
        const filesData = Array.isArray(parsedResponse.data)
          ? parsedResponse.data
          : (parsedResponse.data ? [parsedResponse.data] : []);

        return {
          ...parsedResponse,
          data: filesData
        };
      } catch (parseError) {
        console.error('Error parsing getUserFiles response:', parseError);
        throw new Error('Failed to parse response from server');
      }
    } catch (error) {
      console.error('Error getting user files:', error);
      throw error;
    }
  },

  /**
   * Creates a support ticket
   */
  createTicket: async (ticketDetails: any) => {
    try {
      return await makeRequest(LAMBDA_ENDPOINTS.createTicket, 'POST', { ...ticketDetails, userId: TEST_USER_ID });
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
      return await makeRequest(`${LAMBDA_ENDPOINTS.getPrompts}?userId=${TEST_USER_ID}`, 'GET');
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
      return await makeRequest(`${LAMBDA_ENDPOINTS.getPromptById.replace(':id', id)}?userId=${TEST_USER_ID}`, 'GET');
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
      return await makeRequest(LAMBDA_ENDPOINTS.createPrompt, 'POST', { ...promptData, userId: TEST_USER_ID });
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
        userId: TEST_USER_ID
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
      return await makeRequest(`${LAMBDA_ENDPOINTS.deletePrompt.replace(':id', id)}?userId=${TEST_USER_ID}`, 'DELETE');
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
  const isLoading = useApiStore((state) => !!state.requests[requestId]?.status === 'pending');
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
