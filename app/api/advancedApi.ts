// Update app/api/advancedApi.ts
import {
  LAMBDA_ENDPOINTS,
  ChatHistoryItem,
  TicketDetails,
  ApiResponse,
  handleClientError
} from '../utils/lambdaApi';

// Existing interfaces remain the same...

// API functions using AWS Lambda endpoints:

export async function processChatMessage(
  message: string,
  history: ChatHistoryItem[],
  attachments?: any[]
): Promise<ApiResponse> {
  try {
    // Prepare request payload
    const payload: any = {
      message: message,
      history: history,
      sessionId: `session-${Date.now()}`
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
    const response = await fetch(LAMBDA_ENDPOINTS.processChatMessage, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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

    // Call the Lambda API endpoint
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
    // Validate ticket details
    if (!ticketDetails || !ticketDetails.subject) {
      throw new Error('Invalid ticket details');
    }

    // Call the Lambda API endpoint
    const response = await fetch(LAMBDA_ENDPOINTS.createTicket, {
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

export async function quickLinkApi(action: string, parameter: string): Promise<ApiResponse> {
  try {
    // Validate inputs
    if (!action) {
      throw new Error('No action specified');
    }

    // Call the Lambda API endpoint
    const response = await fetch(LAMBDA_ENDPOINTS.quickLink, {
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

export async function deleteFileApi(fileUrl: string): Promise<ApiResponse> {
  try {
    const s3Key = fileUrl.split('.amazonaws.com/')[1];
    if (!s3Key) {
      throw new Error('Invalid file URL');
    }

    // Call the Lambda API endpoint
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
}// AWS Lambda API integration for frontend components
