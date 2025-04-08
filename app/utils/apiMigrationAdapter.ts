// app/utils/apiMigrationAdapter.ts
/**
 * This file is a temporary adapter to maintain backward compatibility
 * while we migrate to the new Zustand-based API service.
 * 
 * It simply re-exports the functions from apiService.ts with the same names
 * as they were in the original advancedApi.ts file.
 */

import { apiService, TEST_USER_ID } from './apiService';
import { LAMBDA_ENDPOINTS } from './lambdaApi';

// Re-export utility functions from apiService
export const normalizeS3Url = (url: string): string => {
  return url;
};

export const extractS3KeyFromUrl = (url: string): string => {
  return url.split('/').pop() || '';
};

export const standardizeFileObject = (file: any): any => {
  return {
    name: file.name || file.fileName || 'Untitled File',
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    url: file.url || file.presignedUrl || '',
  };
};

export const standardizeFileObjects = (files: any[]): any[] => {
  return files.map(standardizeFileObject);
};

// Define interfaces that were previously imported from advancedApi.ts
export interface UnifiedApiResponse {
  data?: any;
  error?: string;
  url?: string;
  fileUrl?: string;
  chatId?: string;
  timestamp?: string;
  suggestions?: string[];
  multimedia?: any;
  report?: any;
  success?: boolean;
  message?: string;
  fileId?: string;
  requestId?: string;
  status?: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  result?: any;
  workflowType?: 'CHAT' | 'DOCUMENT_ANALYSIS' | 'DATA_ANALYSIS';
  updatedAt?: string;
}

// Options for async requests
export interface AsyncRequestOptions {
  sessionId?: string;
  history?: any[];
  attachments?: any[];
}

// Re-export constants
export const TEST_USER_ID = TEST_USER_ID;

// Re-export API functions with the same names as in advancedApi.ts
export const sendMessage = async (message: string, chatSessionId: string, files?: any[]): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.sendMessage(message, chatSessionId, files);
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
};

export const checkStatus = async (requestId: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.checkStatus(requestId);
  } catch (error) {
    console.error('Error checking status:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to check status',
    };
  }
};

export const uploadFileApi = async (file: File, sessionId?: string, p0?: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.uploadFile(file, sessionId);
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
};

export const deleteFileApi = async (fileUrl: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.deleteFile(fileUrl);
  } catch (error) {
    console.error('Error deleting file:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
};

export const downloadFileApi = async (fileUrlOrKey: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.downloadFile(fileUrlOrKey);
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to download file',
    };
  }
};

export const getUserFilesApi = async (): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.getUserFiles();
  } catch (error) {
    console.error('Error getting user files:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to get user files',
    };
  }
};

export const createTicketApi = async (ticketDetails: any): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.createTicket(ticketDetails);
  } catch (error) {
    console.error('Error creating ticket:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create ticket',
    };
  }
};

export const getPromptsApi = async (filters?: any): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.getPrompts();
  } catch (error) {
    console.error('Error getting prompts:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to get prompts',
    };
  }
};

export const getPromptByIdApi = async (promptId: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.getPromptById(promptId);
  } catch (error) {
    console.error(`Error getting prompt ${promptId}:`, error);
    return {
      error: error instanceof Error ? error.message : `Failed to get prompt ${promptId}`,
    };
  }
};

export const createPromptApi = async (promptData: any): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.createPrompt(promptData);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create prompt',
    };
  }
};

export const updatePromptApi = async (promptId: string, promptData: any): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.updatePrompt(promptId, promptData);
  } catch (error) {
    console.error(`Error updating prompt ${promptId}:`, error);
    return {
      error: error instanceof Error ? error.message : `Failed to update prompt ${promptId}`,
    };
  }
};

export const deletePromptApi = async (promptId: string): Promise<UnifiedApiResponse> => {
  try {
    return await apiService.deletePrompt(promptId);
  } catch (error) {
    console.error(`Error deleting prompt ${promptId}:`, error);
    return {
      error: error instanceof Error ? error.message : `Failed to delete prompt ${promptId}`,
    };
  }
};

export const startDocumentAnalysis = async (
  files: any[],
  message: string = 'Please analyze these documents',
  options: any = {}
): Promise<UnifiedApiResponse> => {
  try {
    return await sendMessage(
      message,
      options.sessionId || `session-${Date.now()}`,
      files
    );
  } catch (error) {
    console.error('Error starting document analysis:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to start document analysis',
    };
  }
};
