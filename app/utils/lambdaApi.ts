import { MultimediaData } from "../types/shared";
import { extractS3KeyFromUrl } from "./fileUtils";

// app/utils/lambdaApi.ts
export const API_BASE_URL = 'https://api-ammydeen9.alpha.aseekbot.ammydeen.people.aws.dev';

export const LAMBDA_ENDPOINTS = {
  // Core endpoints
  message: `${API_BASE_URL}/message`,
  status: `${API_BASE_URL}/status`,

  // File management endpoints
  uploadFile: `${API_BASE_URL}/uploadFile`,
  deleteFile: `${API_BASE_URL}/deleteFile`,
  downloadFile: `${API_BASE_URL}/files/download`,
  getUserFiles: `${API_BASE_URL}/getUserFiles`,

  // Support endpoints
  createTicket: `${API_BASE_URL}/createTicket`,
  quickLink: `${API_BASE_URL}/quickLink`,

  // Prompt management endpoints
  getPrompts: `${API_BASE_URL}/prompts`,
  getPromptById: `${API_BASE_URL}/prompts/:id`,
  createPrompt: `${API_BASE_URL}/prompts`,
  updatePrompt: `${API_BASE_URL}/prompts/:id`,
  deletePrompt: `${API_BASE_URL}/prompts/:id`
};

// Define the necessary interfaces
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  chatId: string; // REQUIRED: Identifies which conversation this message belongs to
  messageOrder?: number; // Position of this message in the conversation sequence
  timestamp?: string; // When this message was created
}

// Interface for chat message requests
export interface ChatMessageRequest {
  message: string;
  chatHistory?: ChatHistoryItem[];
  chatId: string; // REQUIRED: Must be passed for ALL messages to maintain conversation continuity
  fileIds?: string[];
  sessionId?: string; // Optional session identifier
  chatSessionId?: string; // REQUIRED: Identifies which chat session this message belongs to (common for all messages in a session)
  userId?: string; // Optional user identifier
}

export interface TicketDetails {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  email?: string;
  [key: string]: unknown; // For any additional fields
}

// Update to ApiResponse interface in lambdaApi.ts
export interface ApiResponse {
  timestamp: string;
  suggestions: never[];
  multimedia: { type: "video" | "graph" | "image"; data: MultimediaData; } | undefined;
  report: { title: string; content: string; citations?: string[] | undefined; } | undefined;
  url: string;
  subject?: any;
  createdAt?: string;
  ticketId?: string;
  status?: string;
  fileUrl?: string;
  fileId?: string | undefined;
  success?: boolean;
  data?: any[];
  // Add the prompts property to support the prompts API response
  prompts?: any[]; // You can replace 'any[]' with a more specific type like 'Prompt[]'
  count?: number; // Add the count property for prompts response
  error?: string;
  message?: string;
  formattedMessage?: string;
  formattedResponse?: string;
  requestId?: string;
  progress?: number;
  result?: any;
  chatId: string; // REQUIRED: Identifies which chat conversation this response belongs to
  messageOrder?: number; // Indicates the position of this message in the conversation sequence
  sessionId?: string; // Session identifier for tracking user sessions (this is the chatSessionId)
  chatSessionId?: string; // Alias for sessionId - identifies the entire chat session (common across all messages in a session)
  workflowType?: 'CHAT' | 'DOCUMENT_ANALYSIS' | 'DATA_ANALYSIS'; // Type of workflow being executed
}

// Helper function for error handling
export function handleClientError(error: unknown, operation: string): never {
  const errorObj = error as Error;
  console.error(`Error ${operation}:`, errorObj);
  throw new Error(`Failed to ${operation}. Please try again.`);
}

// Using extractS3KeyFromUrl from fileUtils.ts

/**
 * Helper function to ensure chat continuity by preserving chatId
 *
 * This function helps maintain conversation context by ensuring the same
 * chatId is used for all messages in a conversation thread.
 *
 * @param existingChatId - The current chatId from ongoing conversation (if any)
 * @param response - The API response which may contain a new chatId
 * @returns The chatId to use for subsequent requests
 */
export function preserveChatContinuity(existingChatId: string | undefined, response: ApiResponse): string {
  // If we already have a chatId, keep using it for conversation continuity
  if (existingChatId) {
    return existingChatId;
  }

  // Otherwise use the chatId from the response (which the backend generated)
  if (response.chatId) {
    return response.chatId;
  }

  // If no chatId is available, generate a fallback (though this should rarely happen)
  // This generated chatId MUST be stored and reused for all subsequent messages in this conversation
  const newChatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  console.warn('Generated new chatId as fallback. This should be stored and reused for the entire conversation:', newChatId);
  return newChatId;
}
