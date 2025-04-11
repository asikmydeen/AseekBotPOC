// app/constants/chatConstants.ts
/**
 * This file contains centralized text constants for chat components.
 * Use these constants instead of string literals throughout the codebase.
 */

/**
 * Chat UI text constants
 */
export const CHAT_UI_TEXT = {
  // Typing indicator
  TYPING_INDICATOR: "AseekBot is thinking",
  
  // Empty state
  EMPTY_STATE_TITLE: "No messages yet",
  EMPTY_STATE_DESCRIPTION: "Start a conversation with AseekBot by typing a message below.",
  
  // Error messages
  ERROR_NO_CONTENT: "Error: No message content available.",
  
  // File upload
  FILE_UPLOAD_DRAG_ACTIVE: "Drop the files here...",
  FILE_UPLOAD_DRAG_INACTIVE: "Drag and drop files here, or click to select files",
  FILE_UPLOAD_SUPPORTED_FORMATS: "Supported formats: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG",
  FILE_UPLOAD_ANALYZE_BUTTON: "Analyze the File(s)",
  FILE_UPLOAD_ANALYZE_DOCUMENT: "Analyze Document",
  FILE_UPLOAD_SEND_BUTTON: "Send with Message",
  FILE_UPLOAD_CANCEL_BUTTON: "Cancel",
  
  // File size formatting
  FILE_SIZE_UNITS: ["Bytes", "KB", "MB", "GB"],
  
  // Attachments
  ATTACHMENTS_TITLE_SINGULAR: "1 Attachment",
  ATTACHMENTS_TITLE_PLURAL: "Attachments",
  ATTACHMENTS_SHOW_MORE: "Show All",
  ATTACHMENTS_SHOW_LESS: "Show Less",
  
  // Suggestions
  SUGGESTIONS_TITLE: "Suggested replies",
  SUGGESTIONS_HIDE: "Hide",
  
  // Image dialog
  IMAGE_DIALOG_TITLE: "External Image",
  IMAGE_DIALOG_CONTENT: "This message contains an image from an external source. Would you like to view it?",
  IMAGE_DIALOG_CANCEL: "Cancel",
  IMAGE_DIALOG_CONFIRM: "View Image",
  
  // Chat header
  CHAT_HEADER_TITLE: "AseekBot",
  CHAT_HEADER_SEARCH_PLACEHOLDER: "Search conversations...",
  CHAT_HEADER_NEW_CHAT: "New Chat",
  
  // Status indicator
  STATUS_INDICATOR_REFRESH: "Refresh",
  STATUS_INDICATOR_CANCEL: "Cancel"
};

/**
 * Chat status display messages
 * These complement the ProcessingStatus enum in @app/types/status.ts
 */
export const CHAT_STATUS_MESSAGES = {
  QUEUED: "Queued for processing",
  STARTED: "Starting process",
  PROCESSING: "Processing your request",
  COMPLETED: "Processing completed",
  FAILED: "Processing failed",
  ERROR: "An error occurred",
  UNKNOWN: "Unknown status"
};

/**
 * Helper function to get a human-readable status message
 * @param status The status string or ProcessingStatus enum value
 * @returns A human-readable status message
 */
export function getChatStatusMessage(status: string): string {
  return CHAT_STATUS_MESSAGES[status as keyof typeof CHAT_STATUS_MESSAGES] || CHAT_STATUS_MESSAGES.UNKNOWN;
}
