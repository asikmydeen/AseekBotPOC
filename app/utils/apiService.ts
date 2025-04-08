// app/utils/apiService.ts
import { useApiStore } from '../store/apiStore';
import { LAMBDA_ENDPOINTS } from './lambdaApi';

// Placeholder for user ID - can be replaced with actual user ID when integrating with user management
export const TEST_USER_ID = 'test-user';

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
        requestOptions.body = JSON.stringify(body);
      }
    }

    // Make the request
    const response = await fetch(url, requestOptions);

    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

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
      // Create form data
      const formData = new FormData();
      formData.append('message', message);
      formData.append('userId', TEST_USER_ID);

      // Include chatId if it exists (for continuing conversations)
      if (chatSessionId) {
        formData.append('chatId', chatSessionId);
      }

      // Add files if they exist
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
      }

      return await makeRequest(LAMBDA_ENDPOINTS.message, 'POST', formData);
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

      return await makeRequest(`${LAMBDA_ENDPOINTS.status}/${requestId}`, 'GET');
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

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', TEST_USER_ID);

      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      return await makeRequest(LAMBDA_ENDPOINTS.uploadFile, 'POST', formData);
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
      const s3Key = fileUrl.split('/').pop() || '';

      return await makeRequest(LAMBDA_ENDPOINTS.deleteFile, 'POST', { s3Key, userId: TEST_USER_ID });
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
        ? fileUrlOrKey.split('/').pop() || ''
        : fileUrlOrKey;

      return await makeRequest(LAMBDA_ENDPOINTS.downloadFile, 'POST', { fileKey, userId: TEST_USER_ID });
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
      return await makeRequest(LAMBDA_ENDPOINTS.getUserFiles, 'POST', { userId: TEST_USER_ID });
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
      return await makeRequest(LAMBDA_ENDPOINTS.createTicket, 'POST', ticketDetails);
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
      return await makeRequest(LAMBDA_ENDPOINTS.getPrompts, 'GET');
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
      return await makeRequest(LAMBDA_ENDPOINTS.getPromptById.replace(':id', id), 'GET');
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
      return await makeRequest(LAMBDA_ENDPOINTS.createPrompt, 'POST', promptData);
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
      return await makeRequest(LAMBDA_ENDPOINTS.updatePrompt.replace(':id', id), 'PUT', promptData);
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
      return await makeRequest(LAMBDA_ENDPOINTS.deletePrompt.replace(':id', id), 'DELETE');
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
