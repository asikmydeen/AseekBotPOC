// app/types/shared.ts
import { Dispatch, ReactNode, SetStateAction } from 'react';

// Shared multimedia data types
export interface VideoData {
  url: string;
  title?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface GraphData {
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  type?: string;
  [key: string]: unknown;
}

export interface ImageData {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export type MultimediaData = VideoData | GraphData | ImageData;

export interface FileAttachment {
  contentType: any;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Ticket related types
export enum TicketStep {
  Title = 0,
  Description = 1,
  Initial = 2
}

export interface TicketDetails {
  title: string;
  description: string;
  priority: string;
  category: string;
  [key: string]: unknown; // Allow additional properties
}

// Feedback related types
export type FeedbackRating = 1 | 2 | 3 | 4 | 5 | null;

export interface FeedbackData {
  rating: FeedbackRating;
  comment: string;
}

// Unified MessageType
export interface MessageType {
  chatId: string;
  chatSessionId: string;
  sender: 'user' | 'bot';
  text: string;
  multimedia?: {
    type: 'video' | 'graph' | 'image';
    data: MultimediaData;
  };
  suggestions?: string[];
  report?: {
    title: string;
    content: string;
    citations?: string[];
  };
  reaction?: 'thumbs-up' | 'thumbs-down';
  timestamp: string;
  ticket?: {
    id: string;
    status: string;
  };
  pinned?: boolean;
  triggerTicket?: boolean;
  attachments?: FileAttachment[];
  id?: string;
  agentType?: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';
  message?: string; // For backward compatibility
  formattedMessage?: string;  // Optional formatted message for display override
  isError?: boolean;
  userId?: string;
}

// Helper type for sharing setState functions
export type SetState<T> = Dispatch<SetStateAction<T>>;

// Type for uploaded file information with better documentation
export interface UploadedFile {
  // Required properties
  name: string;        // The name of the file
  size: number;        // The size of the file in bytes
  type: string;        // The MIME type of the file
  url: string;         // The URL where the file can be accessed

  // Optional properties
  file?: File;         // The original File object if available (browser only)
  status?: 'pending' | 'uploading' | 'success' | 'error';  // Current upload status
  progress?: number;   // Upload progress (0-100)
  fileId?: string;     // Unique identifier for the file
  error?: string;      // Error message if upload failed
}

export type PromptType = 'INDIVIDUAL' | 'COMMUNITY';
export type VariableSource = 'USER' | 'SYSTEM' | 'DATABASE' | 'FILE';

export interface PromptVariable {
  name: string;
  description: string;
  source: VariableSource;
  required: boolean;
  defaultValue?: string;
  sourceDetails?: {
    type?: string;
    databaseType?: string;
    query?: string;
    format?: string;
  };
}

export interface Prompt {
  promptId: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  type: PromptType;
  variables: PromptVariable[];
  tags: string[];
  popularity: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromptRequest {
  title: string;
  description: string;
  content: string;
  type: PromptType;
  variables: PromptVariable[];
  tags: string[];
  isPublished?: boolean;
}

export interface UpdatePromptRequest {
  title?: string;
  description?: string;
  content?: string;
  type?: PromptType;
  variables?: PromptVariable[];
  tags?: string[];
  isPublished?: boolean;
}