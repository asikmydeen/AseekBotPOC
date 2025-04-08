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
    isChatLoading,
    setActiveChat,
    createChat,
    loadChat,
    updateChatMessages,
    removeChatFromHistory,
    renameChatHistory,
    togglePinChat,
    getPinnedChats,
    getRecentChats
  } = useChatHistoryStore();

  return {
    activeChat,
    chatHistory,
    isChatLoading,
    setActiveChat,
    createChat,
    loadChat,
    updateChatMessages,
    removeChatFromHistory,
    renameChatHistory,
    togglePinChat,
    getPinnedChats,
    getRecentChats,
    // For backward compatibility
    pinnedChats: getPinnedChats ? getPinnedChats() : [],
    recentChats: getRecentChats ? getRecentChats() : []
  };
}
