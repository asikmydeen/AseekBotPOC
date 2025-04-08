// app/hooks/useChat.ts
import { useChatStore } from '../store/chatStore';

/**
 * Custom hook for accessing chat state and actions
 * This provides a drop-in replacement for the old useChat hook
 */
export function useChat() {
  const {
    messages,
    isThinking,
    progress,
    searchQuery,
    selectedMultimedia,
    ticketTriggerContext,
    showFileDropzone,
    pendingInput,
    activeAgent,
    filteredMessages,
    
    setMessages,
    addMessage,
    sendMessage,
    setIsThinking,
    setProgress,
    setSearchQuery,
    setSelectedMultimedia,
    openMultimedia,
    setTicketTriggerContext,
    setShowFileDropzone,
    setPendingInput,
    setActiveAgent,
    handleReaction,
    handlePinMessage,
    handleSuggestionClick,
    exportChatAsPDF,
    clearChat
  } = useChatStore();
  
  return {
    messages,
    isThinking,
    progress,
    searchQuery,
    selectedMultimedia,
    ticketTriggerContext,
    showFileDropzone,
    pendingInput,
    activeAgent,
    filteredMessages,
    
    setMessages,
    addMessage,
    sendMessage,
    setIsThinking,
    setProgress,
    setSearchQuery,
    setSelectedMultimedia,
    openMultimedia,
    setTicketTriggerContext,
    setShowFileDropzone,
    setPendingInput,
    setActiveAgent,
    handleReaction,
    handlePinMessage,
    handleSuggestionClick,
    exportChatAsPDF,
    clearChat
  };
}
