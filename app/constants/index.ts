// app/constants/index.ts
/**
 * This file contains centralized constants for the entire application.
 * Use these constants instead of string literals throughout the codebase.
 */

/**
 * Message sender types
 */
export enum SenderType {
  USER = 'user',
  BOT = 'bot'
}

/**
 * Agent types for different bot personas
 */
export enum AgentType {
  DEFAULT = 'default',
  BID_ANALYSIS = 'bid-analysis',
  SUPPLIER_SEARCH = 'supplier-search',
  PRODUCT_COMPARISON = 'product-comparison',
  TECHNICAL_SUPPORT = 'technical-support'
}

/**
 * Agent type display names
 */
export const AGENT_DISPLAY_NAMES: Record<AgentType, string> = {
  [AgentType.DEFAULT]: 'Aseek Assistant',
  [AgentType.BID_ANALYSIS]: 'Bid Analysis Agent',
  [AgentType.SUPPLIER_SEARCH]: 'Supplier Search Agent',
  [AgentType.PRODUCT_COMPARISON]: 'Product Comparison Agent',
  [AgentType.TECHNICAL_SUPPORT]: 'Technical Support Agent'
};

/**
 * Message reaction types
 */
export enum ReactionType {
  THUMBS_UP = 'thumbs-up',
  THUMBS_DOWN = 'thumbs-down'
}

/**
 * Multimedia content types
 */
export enum MultimediaType {
  VIDEO = 'video',
  GRAPH = 'graph',
  IMAGE = 'image'
}

/**
 * Artifact content types
 */
export enum ArtifactType {
  HTML = 'html',
  REACT = 'react',
  CODE = 'code',
  IMAGE = 'image',
  MARKDOWN = 'markdown',
  MERMAID = 'mermaid',
  SVG = 'svg'
}

/**
 * Programming languages for code artifacts
 */
export enum CodeLanguage {
  HTML = 'html',
  CSS = 'css',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JSX = 'jsx',
  TSX = 'tsx',
  PYTHON = 'python',
  JAVA = 'java',
  CPP = 'cpp',
  C = 'c',
  MARKDOWN = 'markdown',
  MERMAID = 'mermaid',
  SVG = 'svg',
  TEXT = 'text'
}

/**
 * Button types for UI components
 */
export enum ButtonType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  REACTION = 'reaction',
  TOGGLE = 'toggle'
}

/**
 * File upload status types
 */
export enum FileUploadStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

/**
 * Default welcome message from the bot
 */
export const DEFAULT_WELCOME_MESSAGE = "Hello! I'm AseekBot, your AI assistant. How can I help you today?";

/**
 * Default error messages
 */
export const ERROR_MESSAGES = {
  GENERAL: 'An unexpected error occurred. Please try again.',
  NO_CONTENT: 'Error: No message content available.',
  API_FAILURE: 'Failed to communicate with the server. Please try again later.',
  FILE_UPLOAD: 'Failed to upload file. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.'
};

/**
 * Type guard to check if a string is a valid SenderType
 */
export function isValidSenderType(sender: string): sender is SenderType {
  return Object.values(SenderType).includes(sender as SenderType);
}

/**
 * Type guard to check if a string is a valid AgentType
 */
export function isValidAgentType(agent: string): agent is AgentType {
  return Object.values(AgentType).includes(agent as AgentType);
}

/**
 * Type guard to check if a string is a valid ReactionType
 */
export function isValidReactionType(reaction: string): reaction is ReactionType {
  return Object.values(ReactionType).includes(reaction as ReactionType);
}

/**
 * Type guard to check if a string is a valid MultimediaType
 */
export function isValidMultimediaType(type: string): type is MultimediaType {
  return Object.values(MultimediaType).includes(type as MultimediaType);
}

/**
 * Type guard to check if a string is a valid ArtifactType
 */
export function isValidArtifactType(type: string): type is ArtifactType {
  return Object.values(ArtifactType).includes(type as ArtifactType);
}

/**
 * Type guard to check if a string is a valid CodeLanguage
 */
export function isValidCodeLanguage(language: string): language is CodeLanguage {
  return Object.values(CodeLanguage).includes(language as CodeLanguage);
}

/**
 * Get the display name for an agent type
 */
export function getAgentDisplayName(agentType: string): string {
  if (isValidAgentType(agentType)) {
    return AGENT_DISPLAY_NAMES[agentType];
  }
  return AGENT_DISPLAY_NAMES[AgentType.DEFAULT];
}
