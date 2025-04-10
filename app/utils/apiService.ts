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
// Special function for vendor-sow-comparison-analysis-v1 prompt
async function sendVendorAnalysisMessage(message: string, chatSessionId: string, files: any[]) {
  console.log('Using special vendor analysis message function');

  // Create the exact payload format needed
  const payload = {
    promptId: 'vendor-sow-comparison-analysis-v1',
    userId: TEST_USER_ID,
    sessionId: chatSessionId,
    chatId: chatSessionId,
    message: message,
    s3Files: []
  };

  // Format files with the exact naming convention needed
  if (files && files.length > 0) {
    // Find SOW file
    const sowFile = files.find(file =>
      file.name.toLowerCase().includes('sow') ||
      (file.type && file.type.toLowerCase().includes('word')));

    // Find LSK file
    const lskFile = files.find(file =>
      file.name.toLowerCase().includes('lsk') ||
      file.name.toLowerCase().includes('sin v2'));

    // Find Acme file
    const acmeFile = files.find(file =>
      file.name.toLowerCase().includes('acme') ||
      file.name.toLowerCase().includes('associates'));

    // Add files in the correct order with the correct names
    if (lskFile) {
      payload.s3Files.push({
        name: 'LSK_Bid',
        fileName: lskFile.name,
        s3Url: lskFile.url || lskFile.fileUrl || lskFile.s3Url || '',
        mimeType: lskFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } else if (files.length > 0) {
      // If no LSK file found, use the first file
      payload.s3Files.push({
        name: 'LSK_Bid',
        fileName: files[0].name,
        s3Url: files[0].url || files[0].fileUrl || files[0].s3Url || '',
        mimeType: files[0].type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (acmeFile) {
      payload.s3Files.push({
        name: 'Acme_Bid',
        fileName: acmeFile.name,
        s3Url: acmeFile.url || acmeFile.fileUrl || acmeFile.s3Url || '',
        mimeType: acmeFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    } else if (files.length > 1) {
      // If no Acme file found, use the second file
      payload.s3Files.push({
        name: 'Acme_Bid',
        fileName: files[1].name,
        s3Url: files[1].url || files[1].fileUrl || files[1].s3Url || '',
        mimeType: files[1].type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (sowFile) {
      payload.s3Files.push({
        name: 'SOW',
        fileName: sowFile.name,
        s3Url: sowFile.url || sowFile.fileUrl || sowFile.s3Url || '',
        mimeType: sowFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    } else if (files.length > 2) {
      // If no SOW file found, use the third file
      payload.s3Files.push({
        name: 'SOW',
        fileName: files[2].name,
        s3Url: files[2].url || files[2].fileUrl || files[2].s3Url || '',
        mimeType: files[2].type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }
  }

  console.log('Sending vendor analysis message with payload:', JSON.stringify(payload, null, 2));

  // Make the API request directly
  return await makeRequest(LAMBDA_ENDPOINTS.message, 'POST', payload);
}

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
      let payload: any;

      // Handle the case where messageOrOptions is an object (new format)
      if (typeof messageOrOptions === 'object') {
        payload = { ...messageOrOptions };

        // Ensure userId is set
        if (!payload.userId) {
          payload.userId = TEST_USER_ID;
        }
      }
      // Handle the case where messageOrOptions is a string (old format)
      else {
        payload = {
          message: messageOrOptions,
          userId: TEST_USER_ID
        };

        // Include chatId if it exists (for continuing conversations)
        if (chatSessionId) {
          payload.chatId = chatSessionId;
          payload.sessionId = chatSessionId;
        }

        // Add files if they exist
        if (files && files.length > 0) {
          // Add files to payload
          payload.files = files.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
            url: file.url || file.fileUrl || file.s3Url || ''
          }));

          // Create s3Files with specific naming for vendor bid analysis
          payload.s3Files = files.map((file, index) => {
            // Determine name based on file type and index
            let name;
            const lowerFileName = file.name.toLowerCase();

            if (lowerFileName.includes('sow')) {
              name = 'SOW';
            } else if (lowerFileName.includes('lsk') || lowerFileName.includes('sin v2')) {
              name = 'LSK_Bid';
            } else if (lowerFileName.includes('acme') || lowerFileName.includes('associates')) {
              name = 'Acme_Bid';
            } else if (index === 0) {
              name = 'LSK_Bid';
            } else if (index === 1) {
              name = 'Acme_Bid';
            } else if (index === 2) {
              name = 'SOW';
            } else {
              name = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
            }

            return {
              name: name,
              fileName: file.name,
              s3Url: file.url || file.fileUrl || file.s3Url || '',
              mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
          });
        }

        // If we have s3Files, remove the regular files array
        if (payload.s3Files && payload.s3Files.length > 0) {
          delete payload.files;
        }

        // Check if we have prompt metadata
        const metadataJson = localStorage.getItem('promptMetadata');
        if (metadataJson) {
          try {
            const promptMetadata = JSON.parse(metadataJson);
            console.log('Including prompt metadata in request:', promptMetadata);

            // Add promptMetadata to the payload
            payload.promptMetadata = promptMetadata;

            // If we have variables, add them directly to the payload
            if (promptMetadata.variables) {
              payload.variables = promptMetadata.variables;
            }

            // If we have a promptId, add it directly to the payload
            if (promptMetadata.promptId) {
              payload.promptId = promptMetadata.promptId;
            }

            // If we have s3Files in the payload, add them to the promptMetadata
            if (payload.s3Files && payload.s3Files.length > 0) {
              promptMetadata.s3Files = payload.s3Files;
            }
          } catch (error) {
            console.error('Error parsing promptMetadata:', error);
          }
        }

        // Log the s3Files that will be included
        if (payload.s3Files && payload.s3Files.length > 0) {
          console.log('Including s3Files in request:', payload.s3Files);
        }
      }

      // Special handling for vendor-sow-comparison-analysis-v1 prompt
      if ((payload.promptId === 'vendor-sow-comparison-analysis-v1' ||
           (payload.promptMetadata && payload.promptMetadata.promptId === 'vendor-sow-comparison-analysis-v1')) &&
          payload.s3Files && payload.s3Files.length > 0) {
        console.log('Detected vendor-sow-comparison-analysis-v1 prompt, applying special formatting');

        // Hard-code the exact format needed for the vendor-sow-comparison-analysis-v1 prompt
        const formattedS3Files = [];

        // Find SOW file
        const sowFile = payload.s3Files.find(file =>
          file.fileName.toLowerCase().includes('sow') ||
          file.name.toLowerCase().includes('sow'));

        // Find LSK file
        const lskFile = payload.s3Files.find(file =>
          file.fileName.toLowerCase().includes('lsk') ||
          file.fileName.toLowerCase().includes('sin v2') ||
          file.name.toLowerCase().includes('lsk'));

        // Find Acme file
        const acmeFile = payload.s3Files.find(file =>
          file.fileName.toLowerCase().includes('acme') ||
          file.fileName.toLowerCase().includes('associates') ||
          file.name.toLowerCase().includes('acme'));

        // Add files in the correct order with the correct names
        if (lskFile) {
          formattedS3Files.push({
            name: 'LSK_Bid',
            fileName: lskFile.fileName,
            s3Url: lskFile.s3Url,
            mimeType: lskFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        } else if (payload.s3Files.length > 0) {
          // If no LSK file found, use the first file
          formattedS3Files.push({
            name: 'LSK_Bid',
            fileName: payload.s3Files[0].fileName,
            s3Url: payload.s3Files[0].s3Url,
            mimeType: payload.s3Files[0].mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        }

        if (acmeFile) {
          formattedS3Files.push({
            name: 'Acme_Bid',
            fileName: acmeFile.fileName,
            s3Url: acmeFile.s3Url,
            mimeType: acmeFile.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        } else if (payload.s3Files.length > 1) {
          // If no Acme file found, use the second file
          formattedS3Files.push({
            name: 'Acme_Bid',
            fileName: payload.s3Files[1].fileName,
            s3Url: payload.s3Files[1].s3Url,
            mimeType: payload.s3Files[1].mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
        }

        if (sowFile) {
          formattedS3Files.push({
            name: 'SOW',
            fileName: sowFile.fileName,
            s3Url: sowFile.s3Url,
            mimeType: sowFile.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
        } else if (payload.s3Files.length > 2) {
          // If no SOW file found, use the third file
          formattedS3Files.push({
            name: 'SOW',
            fileName: payload.s3Files[2].fileName,
            s3Url: payload.s3Files[2].s3Url,
            mimeType: payload.s3Files[2].mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
        }

        console.log('Formatted s3Files for vendor-sow-comparison-analysis-v1:', formattedS3Files);

        // Replace the s3Files array with the formatted one
        payload.s3Files = formattedS3Files;

        // Also update the s3Files in promptMetadata if it exists
        if (payload.promptMetadata) {
          payload.promptMetadata.s3Files = formattedS3Files;
        }
      }

      console.log('Sending message with payload:', JSON.stringify(payload, null, 2));

      // Log specific details about files and s3Files
      if (payload.files) {
        console.log('Files in payload:', payload.files.length);
      }
      if (payload.s3Files) {
        console.log('s3Files in payload:', payload.s3Files.length);
        console.log('s3Files details:', JSON.stringify(payload.s3Files, null, 2));
      }
      if (payload.promptMetadata && payload.promptMetadata.s3Files) {
        console.log('s3Files in promptMetadata:', payload.promptMetadata.s3Files.length);
      }
      const response = await makeRequest(LAMBDA_ENDPOINTS.message, 'POST', payload);

      // Clear prompt metadata after sending
      localStorage.removeItem('promptMetadata');

      return response;
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
      console.log('Fetching user files for user:', TEST_USER_ID);

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
