// app/utils/lambdaApi.ts
export const API_BASE_URL = 'https://c9mue0raqh.execute-api.us-east-1.amazonaws.com/dev';

export const LAMBDA_ENDPOINTS = {
  processChatMessage: `${API_BASE_URL}/processChatMessage`,
  uploadFile: `${API_BASE_URL}/uploadFile`,
  deleteFile: `${API_BASE_URL}/deleteFile`,
  createTicket: `${API_BASE_URL}/createTicket`,
  quickLink: `${API_BASE_URL}/quickLink`,

  // New endpoints for async processing
  startProcessing: `${API_BASE_URL}/startProcessing`,
  checkStatus: `${API_BASE_URL}/checkStatus`,
  workerProcessor: `${API_BASE_URL}/workerProcessor`
};

// Also define the necessary interfaces here for better organization
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  subject?: any;
  createdAt?: string;
  ticketId?: string;
  status?: string;
  fileUrl?: string;
  fileId?: string | undefined;
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  requestId?: string;
  progress?: number;
  result?: any;
}

// Helper function for error handling
export function handleClientError(error: unknown, operation: string): never {
  const errorObj = error as Error;
  console.error(`Error ${operation}:`, errorObj);
  throw new Error(`Failed to ${operation}. Please try again.`);
}