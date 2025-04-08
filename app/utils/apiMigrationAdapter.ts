// app/utils/apiMigrationAdapter.ts
/**
 * This adapter provides the same interface as the old advancedApi.ts functions
 * but uses the new Zustand-based API service under the hood.
 * 
 * This allows for a gradual migration without breaking existing components.
 * 
 * IMPORTANT: This file is temporary and should be removed once all components
 * have been migrated to use the new API service directly.
 */

import { apiService } from './apiService';
import { UnifiedApiResponse } from '../api/advancedApi';
import { TicketDetails, PromptType, CreatePromptRequest, UpdatePromptRequest } from '../types/shared';

// Re-export utility functions and types from advancedApi.ts
export { 
  normalizeS3Url, 
  extractS3KeyFromUrl, 
  standardizeFileObject, 
  standardizeFileObjects,
  UnifiedApiResponse,
  AsyncRequestOptions
} from '../api/advancedApi';

/**
 * Sends a message to the API
 */
export async function sendMessage(
  message: string,
  chatSessionId: string,
  files?: any[]
): Promise<UnifiedApiResponse> {
  try {
    return await apiService.sendMessage(message, chatSessionId, files);
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to send message',
      url: '',
      chatId: 'sendMessage-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Checks the status of a request
 */
export async function checkStatus(requestId: string): Promise<UnifiedApiResponse> {
  try {
    return await apiService.checkStatus(requestId);
  } catch (error) {
    console.error('Error checking status:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to check status',
      url: '',
      chatId: 'checkStatus-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Uploads a file to the API
 */
export async function uploadFileApi(
  file: File, 
  sessionId?: string, 
  p0?: string
): Promise<UnifiedApiResponse> {
  try {
    return await apiService.uploadFile(file, sessionId);
  } catch (error) {
    console.error('Error uploading file:', error);
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

/**
 * Deletes a file from the API
 */
export async function deleteFileApi(fileUrl: string): Promise<UnifiedApiResponse> {
  try {
    return await apiService.deleteFile(fileUrl);
  } catch (error) {
    console.error('Error deleting file:', error);
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

/**
 * Downloads a file from the API
 */
export async function downloadFileApi(fileUrlOrKey: string): Promise<UnifiedApiResponse> {
  try {
    return await apiService.downloadFile(fileUrlOrKey);
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to download file',
      url: '',
      chatId: 'downloadFile-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Gets all files for the current user
 */
export async function getUserFilesApi(): Promise<UnifiedApiResponse> {
  try {
    return await apiService.getUserFiles();
  } catch (error) {
    console.error('Error getting user files:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get user files',
      url: '',
      chatId: 'getUserFiles-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Creates a support ticket
 */
export async function createTicketApi(ticketDetails: TicketDetails): Promise<UnifiedApiResponse> {
  try {
    return await apiService.createTicket(ticketDetails);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to create ticket',
      url: '',
      chatId: 'createTicket-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Gets all prompts
 */
export async function getPromptsApi(filters?: {
  type?: PromptType;
  tag?: string;
  onlyMine?: boolean;
}): Promise<UnifiedApiResponse> {
  try {
    return await apiService.getPrompts();
  } catch (error) {
    console.error('Error getting prompts:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to get prompts',
      url: '',
      chatId: 'getPrompts-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Gets a prompt by ID
 */
export async function getPromptByIdApi(promptId: string): Promise<UnifiedApiResponse> {
  try {
    return await apiService.getPromptById(promptId);
  } catch (error) {
    console.error(`Error getting prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : `Failed to get prompt ${promptId}`,
      url: '',
      chatId: 'getPromptById-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Creates a new prompt
 */
export async function createPromptApi(promptData: CreatePromptRequest): Promise<UnifiedApiResponse> {
  try {
    return await apiService.createPrompt(promptData);
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

/**
 * Updates an existing prompt
 */
export async function updatePromptApi(
  promptId: string, 
  promptData: UpdatePromptRequest
): Promise<UnifiedApiResponse> {
  try {
    return await apiService.updatePrompt(promptId, promptData);
  } catch (error) {
    console.error(`Error updating prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : `Failed to update prompt ${promptId}`,
      url: '',
      chatId: 'updatePrompt-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Deletes a prompt
 */
export async function deletePromptApi(promptId: string): Promise<UnifiedApiResponse> {
  try {
    return await apiService.deletePrompt(promptId);
  } catch (error) {
    console.error(`Error deleting prompt ${promptId}:`, error);
    return {
      data: [],
      error: error instanceof Error ? error.message : `Failed to delete prompt ${promptId}`,
      url: '',
      chatId: 'deletePrompt-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}

/**
 * Starts document analysis
 */
export async function startDocumentAnalysis(
  files: any[],
  message: string = 'Please analyze these documents',
  options: any = {}
): Promise<UnifiedApiResponse> {
  try {
    return await sendMessage(
      message,
      options.sessionId || `session-${Date.now()}`,
      files
    );
  } catch (error) {
    console.error('Error starting document analysis:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to start document analysis',
      url: '',
      chatId: 'startDocumentAnalysis-error',
      timestamp: Date.now().toString(),
      suggestions: [],
      multimedia: undefined,
      report: undefined
    };
  }
}
