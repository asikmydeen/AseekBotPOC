// app/types/shared.ts
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { SenderType, AgentType, ReactionType, MultimediaType } from '../constants';

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
  sender: SenderType;
  text: string;
  multimedia?: {
    type: MultimediaType;
    data: MultimediaData;
  };
  suggestions?: string[];
  report?: {
    title: string;
    content: string;
    citations?: string[];
  };
  reaction?: ReactionType;
  timestamp: string;
  ticket?: {
    id: string;
    status: string;
  };
  pinned?: boolean;
  triggerTicket?: boolean;
  attachments?: FileAttachment[];
  id?: string;
  agentType?: AgentType;
  message?: string; // For backward compatibility
  formattedMessage?: string;  // Optional formatted message for display override
  isError?: boolean;
  userId?: string;
  completion?: string;  // Completion data from status API response
  aggregatedResults?: any;  // Aggregated results from status API response
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

  // Additional properties for S3 file handling
  fileName?: string;   // The file name (may be different from name in some cases)
  fileKey?: string;    // The S3 key or identifier for the file
  s3Url?: string;      // The S3 URL for the file
  originalS3Url?: string; // The original S3 URL with query parameters
  fileSize?: number;   // The size of the file in bytes (alternative to size)
  fileType?: string;   // The MIME type of the file (alternative to type)
  uploadDate?: string; // The date when the file was uploaded
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