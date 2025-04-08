// app/store/chatHistoryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MessageType } from '../types/shared';

export interface ChatHistoryEntry {
  id: string;
  chatSessionId: string;
  title: string;
  messages: MessageType[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
}

// Helper function to create a new chat
const createNewChat = (): ChatHistoryEntry => {
  const timestamp = new Date().toISOString();
  const sessionId = `session-${Date.now()}`;
  return {
    id: `chat-${Date.now()}`,
    chatSessionId: sessionId,
    title: `Chat ${new Date().toLocaleString()}`,
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false
  };
};

// Helper function to get chat history from localStorage directly
const getStoredChatHistory = (): ChatHistoryEntry[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('aseekbot_chat_history');
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (parsed && parsed.state && Array.isArray(parsed.state.chatHistory)) {
      return parsed.state.chatHistory;
    }
    return [];
  } catch (error) {
    console.error('Failed to parse stored chat history:', error);
    return [];
  }
};

// Get the initial chat history
const initialHistory = getStoredChatHistory();

// Create a default chat for initial state if no history exists
const defaultChat = createNewChat();

// Determine initial state based on stored history
const initialState = {
  activeChat: initialHistory.length > 0 
    ? initialHistory.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] 
    : defaultChat,
  chatHistory: initialHistory.length > 0 ? initialHistory : [defaultChat],
  isChatLoading: false
};

interface ChatHistoryState {
  // State
  activeChat: ChatHistoryEntry;
  chatHistory: ChatHistoryEntry[];
  isChatLoading: boolean;
  
  // Actions
  setActiveChat: (chat: ChatHistoryEntry) => void;
  createChat: () => void;
  loadChat: (chatId: string) => void;
  updateChatMessages: (messages: MessageType[]) => void;
  removeChatFromHistory: (chatId: string) => void;
  renameChatHistory: (chatId: string, newTitle: string) => void;
  togglePinChat: (chatId: string) => void;
  setIsChatLoading: (isLoading: boolean) => void;
  
  // Computed getters
  getPinnedChats: () => ChatHistoryEntry[];
  getRecentChats: () => ChatHistoryEntry[];
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,
      
      // Computed getters
      getPinnedChats: () => get().chatHistory.filter(chat => chat.pinned),
      
      getRecentChats: () => get().chatHistory
        .filter(chat => !chat.pinned)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      
      // Set active chat
      setActiveChat: (chat) => set({ activeChat: chat }),
      
      // Create a new chat
      createChat: () => {
        const newChat = createNewChat();
        console.log('Creating new chat:', newChat.id);
        
        set((state) => {
          const { activeChat, chatHistory } = state;
          
          // Only save the current chat if it has messages
          if (activeChat && activeChat.messages && activeChat.messages.length > 0) {
            console.log('Saving current chat to history:', activeChat.id);
            
            // Check if the chat is already in history
            const existingIndex = chatHistory.findIndex(chat => chat.id === activeChat.id);
            
            if (existingIndex >= 0) {
              // Update existing chat
              const updatedHistory = [...chatHistory];
              updatedHistory[existingIndex] = {
                ...activeChat,
                updatedAt: new Date().toISOString()
              };
              
              return {
                activeChat: newChat,
                chatHistory: [newChat, ...updatedHistory.filter(chat => chat.id !== newChat.id)]
              };
            } else {
              // Add to history if not already there
              return {
                activeChat: newChat,
                chatHistory: [newChat, activeChat, ...chatHistory.filter(chat => 
                  chat.id !== newChat.id && chat.id !== activeChat.id
                )]
              };
            }
          }
          
          // If current chat has no messages, just replace it
          return {
            activeChat: newChat,
            chatHistory: [newChat, ...chatHistory.filter(chat => chat.id !== activeChat.id)]
          };
        });
      },
      
      // Load a chat by ID
      loadChat: (chatId) => {
        set({ isChatLoading: true });
        try {
          set((state) => {
            const chat = state.chatHistory.find(c => c.id === chatId);
            if (chat) {
              return { activeChat: chat };
            }
            return {};
          });
        } catch (error) {
          console.error("Failed to load chat:", error);
        } finally {
          set({ isChatLoading: false });
        }
      },
      
      // Update messages in the active chat
      updateChatMessages: (messages) => {
        const { activeChat } = get();
        
        if (!activeChat) {
          console.error('No active chat to update messages');
          return;
        }
        
        console.log('Updating messages for chat:', activeChat.id, 'with', messages.length, 'messages');
        
        const updatedChat = {
          ...activeChat,
          messages,
          updatedAt: new Date().toISOString()
        };
        
        set((state) => {
          // Find if the chat is already in history
          const existingIndex = state.chatHistory.findIndex(chat => chat.id === activeChat.id);
          
          let updatedHistory = [...state.chatHistory];
          if (existingIndex >= 0) {
            // Update existing chat in history
            updatedHistory[existingIndex] = updatedChat;
          } else {
            // Add to history if not already there
            updatedHistory = [updatedChat, ...updatedHistory.filter(chat => chat.id !== updatedChat.id)];
          }
          
          return {
            activeChat: updatedChat,
            chatHistory: updatedHistory
          };
        });
      },
      
      // Remove a chat from history
      removeChatFromHistory: (chatId) => {
        set((state) => {
          const updatedHistory = state.chatHistory.filter(chat => chat.id !== chatId);
          
          // If active chat is deleted, set a new active chat
          if (state.activeChat.id === chatId) {
            if (updatedHistory.length > 0) {
              // Set the most recent chat as active
              const mostRecent = [...updatedHistory].sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              )[0];
              
              return {
                chatHistory: updatedHistory,
                activeChat: mostRecent
              };
            } else {
              // If no chats left, create a new one
              const newChat = createNewChat();
              
              return {
                chatHistory: [newChat],
                activeChat: newChat
              };
            }
          }
          
          return { chatHistory: updatedHistory };
        });
      },
      
      // Rename a chat
      renameChatHistory: (chatId, newTitle) => {
        set((state) => {
          const updatedHistory = state.chatHistory.map(chat => 
            chat.id === chatId 
              ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() } 
              : chat
          );
          
          // Update active chat if it's the one being renamed
          const updatedActiveChat = state.activeChat.id === chatId
            ? { ...state.activeChat, title: newTitle, updatedAt: new Date().toISOString() }
            : state.activeChat;
          
          return {
            chatHistory: updatedHistory,
            activeChat: updatedActiveChat
          };
        });
      },
      
      // Toggle pinned status of a chat
      togglePinChat: (chatId) => {
        set((state) => {
          const updatedHistory = state.chatHistory.map(chat => 
            chat.id === chatId
              ? { ...chat, pinned: !chat.pinned, updatedAt: new Date().toISOString() }
              : chat
          );
          
          // Update active chat if it's the one being toggled
          const updatedActiveChat = state.activeChat.id === chatId
            ? { ...state.activeChat, pinned: !state.activeChat.pinned }
            : state.activeChat;
          
          return {
            chatHistory: updatedHistory,
            activeChat: updatedActiveChat
          };
        });
      },
      
      // Set loading state
      setIsChatLoading: (isChatLoading) => set({ isChatLoading })
    }),
    {
      name: 'aseekbot_chat_history', // Use the same key as before for localStorage
      partialize: (state) => ({
        chatHistory: state.chatHistory,
        activeChat: state.activeChat
      })
    }
  )
);

// Add pinnedChats and recentChats getters for backward compatibility
Object.defineProperties(useChatHistoryStore, {
  pinnedChats: {
    get: () => useChatHistoryStore.getState().getPinnedChats()
  },
  recentChats: {
    get: () => useChatHistoryStore.getState().getRecentChats()
  }
});
