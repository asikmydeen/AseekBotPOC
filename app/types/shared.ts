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
  isError?: boolean;
}

// Helper type for sharing setState functions
export type SetState<T> = Dispatch<SetStateAction<T>>;

// Type for uploaded file information
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file?: File;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  url: string; // Making url required
  fileId?: string;
  error?: string;
}