// app/hooks/useChatHistory.ts
import { useChatHistoryStore } from '../store/chatHistoryStore';

/**
 * Custom hook for accessing chat history state and actions
 * This provides a drop-in replacement for the old useChatHistory hook
 */
export function useChatHistory() {
  const {
    activeChat,
    chatHistory,
    pinnedChats,
    recentChats,
    isChatLoading,
    setActiveChat,
    createChat,
    loadChat,
    updateChatMessages,
    removeChatFromHistory,
    renameChatHistory,
    togglePinChat
  } = useChatHistoryStore();
  
  return {
    activeChat,
    chatHistory,
    pinnedChats,
    recentChats,
    isChatLoading,
    setActiveChat,
    createChat,
    loadChat,
    updateChatMessages,
    removeChatFromHistory,
    renameChatHistory,
    togglePinChat
  };
}
