import { handleApiError, ErrorResponse } from '../utils/apiErrorHandler';

/**
 * Interface for chat message history items
 */
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Interface for uploaded file references
 */
export interface UploadedFile {
  name: string;
  mimeType: string;
  s3Url: string;
  fileUrl?: string;
}

/**
 * Interface for ticket details
 */
export interface TicketDetails {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  email?: string;
  [key: string]: unknown; // For any additional fields
}

/**
 * Interface for API responses
 */
export interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

/**
 * Common error handler for API client functions
 * @param error - The caught error
 * @param operation - Description of the operation that failed
 * @throws Error with a user-friendly message
 */
function handleClientError(error: unknown, operation: string): never {
  const errorObj = error as Error;
  console.error(`Error ${operation}:`, errorObj);
  throw new Error(`Failed to ${operation}. Please try again.`);
}

/**
 * Processes a chat message and returns a response
 * @param message The user's message
 * @param history Previous chat history
 * @param attachments Optional file attachments
 * @returns Promise with the response data
 */
export async function processChatMessage(
  message: string,
  history: ChatHistoryItem[],
  attachments?: File[]
): Promise<ApiResponse> {
  try {
    // Create form data to send message, history, and attachments
    const formData = new FormData();
    formData.append('message', message);
    formData.append('history', JSON.stringify(history));

    // Add S3 file references if attachments are present
    if (attachments && attachments.length > 0) {
      // Map file objects to the format expected by the API route
      const s3Files = attachments.map(file => {
        // Get the file with additional properties via type casting
        const uploadedFile = file as any;

        return {
          name: file.name,
          mimeType: file.type,
          // Use s3Url from the file or fall back to url/fileUrl properties
          s3Url: uploadedFile.s3Url || uploadedFile.url || uploadedFile.fileUrl
        };
      });

      // Log file references for debugging
      console.debug('Sending file references to Bedrock agent:', s3Files);

      formData.append('s3Files', JSON.stringify(s3Files));
    }

    // Call the API route
    const response = await fetch('/api/processChatMessage', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process chat message');
    }

    return await response.json();
  } catch (error) {
    handleClientError(error, 'process chat message');
  }
}

/**
 * Uploads a file to S3 or similar storage via API route
 * @param file The file to upload
 * @param sessionId Optional session identifier
 * @returns Promise with the upload result
 */
export async function uploadFileApi(file: File, sessionId?: string): Promise<ApiResponse> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Create form data to send file and sessionId
    const formData = new FormData();
    formData.append('file', file);

    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    // Call the API route
    const response = await fetch('/api/uploadFile', {
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

/**
 * Creates a support ticket via API route
 * @param ticketDetails The details of the ticket to create
 * @returns Promise with the ticket information
 */
export async function createTicketApi(ticketDetails: TicketDetails): Promise<ApiResponse> {
  try {
    // Validate ticket details
    if (!ticketDetails || !ticketDetails.subject) {
      throw new Error('Invalid ticket details');
    }

    // Call the API route
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

/**
 * Handles sidebar quick link actions via API route
 * @param action The action to perform
 * @param parameter Additional parameter for the action
 * @returns Promise with the action result
 */
export async function quickLinkApi(action: string, parameter: string): Promise<ApiResponse> {
  try {
    // Validate inputs
    if (!action) {
      throw new Error('No action specified');
    }

    // Call the API route
    const response = await fetch('/api/quickLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

/**
 * Deletes a file from S3 via API route
 * @param fileUrl The S3 URL of the file to delete
 * @returns Promise with the deletion result
 */
export async function deleteFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const s3Key = fileUrl.split('.amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL');
    }
    const response = await fetch('/api/deleteFile', {
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
