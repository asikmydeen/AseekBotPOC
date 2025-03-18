// app/utils/chatHistoryManager.ts
import { MessageType } from "../types/shared";

export interface ChatHistoryEntry {
  id: string;
  title: string;
  messages: MessageType[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

const HISTORY_STORAGE_KEY = 'aseekbot_chat_history';

// Get all chat history entries from local storage
export const getChatHistory = (): ChatHistoryEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const historyJSON = localStorage.getItem(HISTORY_STORAGE_KEY);
    return historyJSON ? JSON.parse(historyJSON) : [];
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
};

// Save chat history to local storage
export const saveChatHistory = (history: ChatHistoryEntry[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
};

// Save a new or update an existing chat session
export const saveChat = (chat: ChatHistoryEntry): void => {
  const history = getChatHistory();
  const existingIndex = history.findIndex(item => item.id === chat.id);

  if (existingIndex >= 0) {
    // Update existing chat
    history[existingIndex] = {
      ...chat,
      updatedAt: new Date().toISOString()
    };
  } else {
    // Add new chat
    history.push(chat);
  }

  saveChatHistory(history);
};

// Start a new chat session
export const createNewChat = (): ChatHistoryEntry => {
  const timestamp = new Date().toISOString();
  return {
    id: `chat-${Date.now()}`,
    title: `Chat ${new Date().toLocaleString()}`,
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false
  };
};

// Delete a chat session
export const deleteChat = (chatId: string): void => {
  const history = getChatHistory();
  const updatedHistory = history.filter(chat => chat.id !== chatId);
  saveChatHistory(updatedHistory);
};

// Rename a chat session
export const renameChat = (chatId: string, newTitle: string): void => {
  const history = getChatHistory();
  const chatIndex = history.findIndex(chat => chat.id === chatId);

  if (chatIndex >= 0) {
    history[chatIndex].title = newTitle;
    history[chatIndex].updatedAt = new Date().toISOString();
    saveChatHistory(history);
  }
};

// Toggle pinned status of a chat
export const toggleChatPinned = (chatId: string): void => {
  const history = getChatHistory();
  const chatIndex = history.findIndex(chat => chat.id === chatId);

  if (chatIndex >= 0) {
    history[chatIndex].pinned = !history[chatIndex].pinned;
    history[chatIndex].updatedAt = new Date().toISOString();
    saveChatHistory(history);
  }
};

// Get a specific chat by ID
export const getChatById = (chatId: string): ChatHistoryEntry | null => {
  const history = getChatHistory();
  return history.find(chat => chat.id === chatId) || null;
};

// Auto-save chat while user is interacting
export const autoSaveChat = (chatId: string, messages: MessageType[]): void => {
  const history = getChatHistory();
  const chatIndex = history.findIndex(chat => chat.id === chatId);

  if (chatIndex >= 0) {
    history[chatIndex].messages = messages;
    history[chatIndex].updatedAt = new Date().toISOString();
    saveChatHistory(history);
  }
};