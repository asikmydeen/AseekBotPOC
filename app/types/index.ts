import { Dispatch, ReactNode, SetStateAction } from 'react';

// Ticket types
export enum TicketStep {
  Title = 0,
  Description = 1,
  Initial
}

export interface TicketDetails {
  title: string;
  description: string;
  priority?: string;
  category?: string;
}

// Feedback types
export type FeedbackRating = 1 | 2 | 3 | 4 | 5 | null;

export interface FeedbackData {
  rating: FeedbackRating;
  comment: string;
}

// Helper type for sharing setState functions
export type SetState<T> = Dispatch<SetStateAction<T>>;

/**
 * Shared type definitions for the AseekBot application
 */

/**
 * Represents a chat message in the application
 */
export interface MessageType {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isLoading?: boolean;
  quickLinks?: QuickLink[];
}

/**
 * Represents a quick link suggestion that can be attached to bot messages
 */
export interface QuickLink {
  message: string;
  title: ReactNode;
  description: ReactNode;
  id: string;
  text: string;
  action?: string;
}