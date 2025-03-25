// app/utils/lambdaApi.ts
// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Use different base URLs depending on the environment
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001/api'  // Point to the separate proxy server https://c9mue0raqh.execute-api.us-east-1.amazonaws.com/dev
  : 'https://api-dev-ammydeen.alpha.aseekbot.ammydeen.people.aws.dev';

export const LAMBDA_ENDPOINTS = {
  processChatMessage: `${API_BASE_URL}/processChatMessage`,
  uploadFile: `${API_BASE_URL}/uploadFile`,
  deleteFile: `${API_BASE_URL}/deleteFile`,
  createTicket: `${API_BASE_URL}/createTicket`,
  quickLink: `${API_BASE_URL}/quickLink`,
  downloadFile: `${API_BASE_URL}/files/download`, // Updated path to match API Gateway configuration
  getUserFiles: `${API_BASE_URL}/getUserFiles`,

  // New endpoints for async processing
  startProcessing: `${API_BASE_URL}/startProcessing`,
  checkStatus: `${API_BASE_URL}/checkStatus`,
  workerProcessor: `${API_BASE_URL}/workerProcessor`
};

// Also define the necessary interfaces here for better organization
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

export interface ApiResponse {
  url: string;
  subject?: any;
  createdAt?: string;
  ticketId?: string;
  status?: string;
  fileUrl?: string;
  fileId?: string | undefined;
  success?: boolean;
  data?: any[];
  error?: string;
  message?: string;
  requestId?: string;
  progress?: number;
  result?: any;
  chatId: string; // REQUIRED: Identifies which chat conversation this response belongs to
  messageOrder?: number; // Indicates the position of this message in the conversation sequence
  sessionId?: string; // Session identifier for tracking user sessions (this is the chatSessionId)
  chatSessionId?: string; // Alias for sessionId - identifies the entire chat session (common across all messages in a session)
}

// Helper function for error handling
export function handleClientError(error: unknown, operation: string): never {
  const errorObj = error as Error;
  console.error(`Error ${operation}:`, errorObj);
  throw new Error(`Failed to ${operation}. Please try again.`);
}

// Helper function to extract S3 key from file URL
export function extractS3KeyFromUrl(fileUrl: string): string {
  if (!fileUrl) {
    throw new Error('Invalid file URL');
  }

  // Handle standard S3 URL format: https://<bucket-name>.s3.<region>.amazonaws.com/<key>
  if (fileUrl.includes('amazonaws.com/')) {
    return fileUrl.split('amazonaws.com/')[1];
  }
  // Handle CloudFront or custom domain URLs
  else if (fileUrl.includes('/') && !fileUrl.startsWith('http')) {
    // Assume it's already a partial path or key
    return fileUrl;
  }

  throw new Error('Unable to extract file key from URL');
}

/**
 * Helper function to ensure chat continuity by preserving chatId
 *
 * This function helps maintain conversation context by ensuring the same
 * chatId is used for all messages in a conversation thread.
 *
 * IMPORTANT: The frontend MUST store and reuse this chatId for all messages
 * in the same conversation to ensure proper grouping in DynamoDB.
 * Store this value in localStorage and include it with every message
 * in the same chat session.
 *
 * NOTE: For tracking entire chat sessions across multiple chatIds, use chatSessionId
 * which should be common for all messages in a single chat session and stored in
 * localStorage for the duration of the session.
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
