// app/constants/chatConstants.ts
/**
 * This file contains centralized text constants for chat components.
 * Use these constants instead of string literals throughout the codebase.
 */

/**
 * Sender type constants
 * These should be used instead of string literals for sender types
 */
export const SENDER_TYPES = {
  USER: 'user',
  BOT: 'bot'
};

/**
 * Chat UI text constants
 */
export const CHAT_UI_TEXT = {
  // Typing indicator
  TYPING_INDICATOR: "AseekBot is thinking",
  TYPING_PLACEHOLDER: "Type your message here...",

  // Empty state
  EMPTY_STATE_TITLE: "No messages yet",
  EMPTY_STATE_DESCRIPTION: "Start a conversation with AseekBot by typing a message below.",
  EMPTY_STATE_PROMPT: "Try asking me a question to get started",
  WELCOME_TITLE: "Welcome to AseekBot!",
  WELCOME_DESCRIPTION: "I'm your AI assistant for data center procurement. How can I help you today?",

  // Error messages
  ERROR_NO_CONTENT: "Error: No message content available.",
  ERROR_UPLOADING: "Error uploading file. Please try again.",
  ERROR_PROCESSING: "Error processing file. Please try a different file.",

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
  STATUS_INDICATOR_CANCEL: "Cancel",
  STATUS_LABEL: "Status:",

  // Document analysis
  DOCUMENT_ANALYSIS_TITLE: "Document Analysis",
  DOCUMENT_ANALYSIS_DESCRIPTION: "Upload documents for analysis. I can extract information, summarize content, and answer questions about your documents.",
  DOCUMENT_ANALYSIS_ANALYZE_BUTTON: "Analyze Documents",
  DOCUMENT_ANALYSIS_CANCEL_BUTTON: "Cancel",

  // Feedback form
  FEEDBACK_FORM_TITLE: "Share Your Feedback",
  FEEDBACK_FORM_DESCRIPTION: "Your feedback helps us improve AseekBot.",
  FEEDBACK_FORM_RATING_LABEL: "Rate your experience:",
  FEEDBACK_FORM_COMMENT_PLACEHOLDER: "Tell us more about your experience (optional)",
  FEEDBACK_FORM_SUBMIT_BUTTON: "Submit Feedback",
  FEEDBACK_FORM_CANCEL_BUTTON: "Cancel",
  FEEDBACK_FORM_SUCCESS: "Thank you for your feedback!",

  // Ticket form
  TICKET_FORM_TITLE: "Create Support Ticket",
  TICKET_FORM_TITLE_LABEL: "Title",
  TICKET_FORM_TITLE_PLACEHOLDER: "Enter a title for your ticket",
  TICKET_FORM_DESCRIPTION_LABEL: "Description",
  TICKET_FORM_DESCRIPTION_PLACEHOLDER: "Describe your issue in detail",
  TICKET_FORM_SUBMIT_BUTTON: "Create Ticket",
  TICKET_FORM_CANCEL_BUTTON: "Cancel",
  TICKET_FORM_SUCCESS: "Ticket created successfully!",

  // File handling
  FILE_UNNAMED: "Unnamed File",
  FILE_UPLOADING: "Uploading...",
  FILE_READY_SINGULAR: "file ready",
  FILE_READY_PLURAL: "files ready",

  // Aria labels
  ARIA_SEND_MESSAGE: "Send message",
  ARIA_ATTACH_FILES: "Attach files",
  ARIA_REMOVE_FILE: "Remove file",
  ARIA_START_NEW_CHAT: "Start new chat",
  ARIA_TOGGLE_THEME: "Switch to {0} mode",
  ARIA_USER_GUIDE: "User Guide",
  ARIA_EXPORT_CONVERSATION: "Export conversation",
  ARIA_PROVIDE_FEEDBACK: "Provide feedback",
  ARIA_CREATE_TICKET: "Create a ticket",
  ARIA_SEARCH: "Search",
  ARIA_TOGGLE_ARTIFACTS: "Toggle artifacts panel",
  ARIA_THUMBS_UP: "Thumbs up",
  ARIA_THUMBS_DOWN: "Thumbs down",
  ARIA_PIN_MESSAGE: "Pin message",
  ARIA_UNPIN_MESSAGE: "Unpin message",
  ARIA_SHOW_CITATIONS: "Show citations",
  ARIA_HIDE_CITATIONS: "Hide citations"
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
