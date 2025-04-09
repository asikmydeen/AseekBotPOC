// app/store/chatStore.ts
import { create } from 'zustand';
import { apiService } from '../utils/apiService';
import { MessageType } from '../types/shared';

interface ChatState {
  // Message state
  messages: MessageType[];
  isThinking: boolean;
  progress: number;

  // Search functionality
  searchQuery: string;

  // Multimedia handling
  selectedMultimedia: { type: string; data: any } | null;

  // Ticket system
  ticketTriggerContext: string | null;

  // File upload state
  showFileDropzone: boolean;
  pendingInput: string;

  // Agent state
  activeAgent: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';

  // Computed values
  filteredMessages: MessageType[];

  // Actions
  setMessages: (messages: MessageType[]) => void;
  addMessage: (message: MessageType) => void;
  sendMessage: (text: string, files?: any[]) => Promise<void>;
  setIsThinking: (isThinking: boolean) => void;
  setProgress: (progress: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedMultimedia: (multimedia: { type: string; data: any } | null) => void;
  openMultimedia: (type: string, data: any) => void;
  setTicketTriggerContext: (context: string | null) => void;
  setShowFileDropzone: (show: boolean) => void;
  setPendingInput: (input: string) => void;
  setActiveAgent: (agent: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support') => void;
  handleReaction: (index: number, reaction: 'thumbs-up' | 'thumbs-down') => void;
  handlePinMessage: (index: number) => void;
  handleSuggestionClick: (suggestion: string) => void;
  exportChatAsPDF: () => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isThinking: false,
  progress: 0,
  searchQuery: '',
  selectedMultimedia: null,
  ticketTriggerContext: null,
  showFileDropzone: false,
  pendingInput: '',
  activeAgent: 'default',

  // Computed values
  get filteredMessages() {
    const { messages, searchQuery } = get();
    if (!searchQuery) return messages;

    return messages.filter(msg =>
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.report?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.report?.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  },

  // Actions
  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set(state => ({
    messages: [...state.messages, message]
  })),

  sendMessage: async (text, files) => {
    if (!text.trim() && (!files || files.length === 0)) return;

    // Create a new user message
    const newUserMessage: MessageType = {
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      id: `user-${Date.now()}`,
      chatId: '',
      chatSessionId: ''
    };

    // Add attachments if files are provided
    if (files && files.length > 0) {
      newUserMessage.attachments = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url || URL.createObjectURL(file),
      }));
    }

    // Add the user message to the chat
    set(state => ({
      messages: [...state.messages, newUserMessage],
      isThinking: true,
      progress: 0,
      ticketTriggerContext: text
    }));

    // Start progress simulation
    const progressInterval = setInterval(() => {
      set(state => {
        if (state.progress >= 90) {
          clearInterval(progressInterval);
          return { progress: 90 };
        }
        return { progress: state.progress + 10 };
      });
    }, 300);

    try {
      // In a real implementation, this would call the API
      // const response = await apiService.sendMessage(text, sessionId, files);

      // For now, simulate a response
      setTimeout(() => {
        // Create a bot response
        const botResponse: MessageType = {
          sender: 'bot',
          text: `This is a simulated response to: "${text}"`,
          timestamp: new Date().toISOString(),
          id: `bot-${Date.now()}`,
          agentType: get().activeAgent,
          chatId: '',
          chatSessionId: ''
        };

        // Add the bot response to the chat
        set(state => ({
          messages: [...state.messages, botResponse],
          isThinking: false,
          progress: 100
        }));

        // Clear the progress interval if it's still running
        clearInterval(progressInterval);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);

      // Handle error
      set({
        isThinking: false,
        progress: 100
      });

      // Clear the progress interval
      clearInterval(progressInterval);
    }
  },

  setIsThinking: (isThinking) => set({ isThinking }),

  setProgress: (progress) => set({ progress }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setSelectedMultimedia: (selectedMultimedia) => set({ selectedMultimedia }),

  openMultimedia: (type, data) => set({ selectedMultimedia: { type, data } }),

  setTicketTriggerContext: (ticketTriggerContext) => set({ ticketTriggerContext }),

  setShowFileDropzone: (showFileDropzone) => set({ showFileDropzone }),

  setPendingInput: (pendingInput) => set({ pendingInput }),

  setActiveAgent: (activeAgent) => set({ activeAgent }),

  handleReaction: (index, reaction) => set(state => {
    const updatedMessages = [...state.messages];
    if (updatedMessages[index]) {
      updatedMessages[index] = {
        ...updatedMessages[index],
        reaction
      };
    }
    return { messages: updatedMessages };
  }),

  handlePinMessage: (index) => set(state => {
    const updatedMessages = [...state.messages];
    if (updatedMessages[index]) {
      updatedMessages[index] = {
        ...updatedMessages[index],
        pinned: !updatedMessages[index].pinned
      };
    }
    return { messages: updatedMessages };
  }),

  handleSuggestionClick: (suggestion) => {
    // Use the suggestion as a new message
    get().sendMessage(suggestion);
  },

  exportChatAsPDF: () => {
    // This would be implemented with a PDF generation library
    console.log('Exporting chat as PDF...');
    alert('Chat export functionality would be implemented here.');
  },

  clearChat: () => set({
    messages: [],
    isThinking: false,
    progress: 0,
    searchQuery: '',
    selectedMultimedia: null,
    ticketTriggerContext: null
  })
}));
