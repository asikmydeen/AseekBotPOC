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

interface ChatHistoryState {
  // State
  activeChat: ChatHistoryEntry;
  chatHistory: ChatHistoryEntry[];
  isChatLoading: boolean;

  // Computed values
  pinnedChats: ChatHistoryEntry[];
  recentChats: ChatHistoryEntry[];

  // Actions
  setActiveChat: (chat: ChatHistoryEntry) => void;
  createChat: () => void;
  loadChat: (chatId: string) => void;
  updateChatMessages: (messages: MessageType[]) => void;
  removeChatFromHistory: (chatId: string) => void;
  renameChatHistory: (chatId: string, newTitle: string) => void;
  togglePinChat: (chatId: string) => void;
  setIsChatLoading: (isLoading: boolean) => void;
}

const defaultChat: ChatHistoryEntry = {
  id: 'default-chat',
  title: 'New Chat',
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  pinned: false,
  chatSessionId: ''
};

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeChat: defaultChat,
      chatHistory: [],
      isChatLoading: false,

      // Computed values
      get pinnedChats() {
        return get().chatHistory.filter(chat => chat.pinned);
      },

      get recentChats() {
        return get().chatHistory
          .filter(chat => !chat.pinned)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      },

      // Set active chat
      setActiveChat: (chat) => set({ activeChat: chat }),

      // Create a new chat
      createChat: () => {
        const newChat = createNewChat();
        set((state) => ({
          activeChat: newChat,
          chatHistory: [newChat, ...state.chatHistory]
        }));
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

        const updatedChat = {
          ...activeChat,
          messages,
          updatedAt: new Date().toISOString()
        };

        set((state) => {
          const updatedHistory = state.chatHistory.map(chat =>
            chat.id === activeChat.id ? updatedChat : chat
          );

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
      name: 'chat-history-storage', // unique name for localStorage
      partialize: (state) => ({
        chatHistory: state.chatHistory,
        activeChat: state.activeChat
      }),
      onRehydrateStorage: () => (state) => {
        // If there's no chat history, initialize with a new chat
        if (!state || !state.chatHistory || state.chatHistory.length === 0) {
          const newChat = createNewChat();
          saveChat(newChat);
          state?.setActiveChat(newChat);
          state?.chatHistory.push(newChat);
        }
      }
    }
  )
);
