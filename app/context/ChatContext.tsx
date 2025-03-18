// app/context/ChatContext.tsx
"use client";
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

// Define the message type
export interface MessageType {
  sender: 'user' | 'bot';
  text: string;
  multimedia?: {
    type: 'video' | 'graph' | 'image';
    data: {
      url?: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      chartData?: Record<string, unknown>;
      videoUrl?: string;
      [key: string]: unknown;
    }
  };
  suggestions?: string[];
  report?: { title: string; content: string; citations?: string[] };
  reaction?: 'thumbs-up' | 'thumbs-down';
  timestamp: string;
  ticket?: { id: string; status: string };
  pinned?: boolean;
  triggerTicket?: boolean;
  attachments?: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  id?: string;
  agentType?: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';
}

// Define the context type
interface ChatContextType {
  // Message state
  messages: MessageType[];
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  filteredMessages: MessageType[];
  sendMessage: (text: string, files?: any[]) => void;
  isThinking: boolean;
  progress: number;

  // Search functionality
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  // Message interactions
  handleReaction: (index: number, reaction: 'thumbs-up' | 'thumbs-down') => void;
  handlePinMessage: (index: number) => void;
  handleSuggestionClick: (suggestion: string) => void;

  // Multimedia handling
  selectedMultimedia: { type: string; data: any } | null;
  setSelectedMultimedia: React.Dispatch<React.SetStateAction<{ type: string; data: any } | null>>;
  openMultimedia: (multimedia: { type: string; data: any }) => void;

  // Export functionality
  exportChatAsPDF: () => void;

  // Ticket system
  ticketTriggerContext: string | null;
  setTicketTriggerContext: React.Dispatch<React.SetStateAction<string | null>>;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>;

  // File upload state
  showFileDropzone: boolean;
  setShowFileDropzone: React.Dispatch<React.SetStateAction<boolean>>;
  pendingInput: string;
  setPendingInput: React.Dispatch<React.SetStateAction<string>>;

  // Agent state
  activeAgent: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';
  setActiveAgent: React.Dispatch<React.SetStateAction<'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support'>>;
}

// Create the context with a default undefined value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Props for the ChatProvider
interface ChatProviderProps {
  children: ReactNode;
}

// Create the provider component
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  // Message state
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multimedia handling
  const [selectedMultimedia, setSelectedMultimedia] = useState<{ type: string; data: any } | null>(null);

  // Ticket system
  const [ticketTriggerContext, setTicketTriggerContext] = useState<string | null>(null);

  // File upload state
  const [showFileDropzone, setShowFileDropzone] = useState<boolean>(false);
  const [pendingInput, setPendingInput] = useState<string>('');

  // Agent state
  const [activeAgent, setActiveAgent] = useState<'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support'>('default');

  // Refs

  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Filter messages based on search query
  const filteredMessages = searchQuery
    ? messages.filter(msg =>
      msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.report?.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.report?.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : messages;

  // Handle sending a message
  const sendMessage = (text: string, files?: any[]) => {
    if (!text.trim() && (!files || files.length === 0)) return;

    // Create a new user message
    const newUserMessage: MessageType = {
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      id: `user-${Date.now()}`,
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
    setMessages(prev => [...prev, newUserMessage]);

    // Set thinking state to show the bot is processing
    setIsThinking(true);
    setProgress(0);

    // Store the context for potential ticket creation
    setTicketTriggerContext(text);

    // Simulate progress (in a real app, this would be based on actual API response progress)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    // Simulate bot response (in a real app, this would be an API call)
    setTimeout(() => {
      // Create a bot response
      const botResponse: MessageType = {
        sender: 'bot',
        text: `This is a simulated response to: "${text}"`,
        timestamp: new Date().toISOString(),
        id: `bot-${Date.now()}`,
        agentType: activeAgent,
      };

      // Add the bot response to the chat
      setMessages(prev => [...prev, botResponse]);

      // Clear thinking state
      setIsThinking(false);
      setProgress(100);

      // Clear the progress interval if it's still running
      clearInterval(progressInterval);

      // Scroll to the bottom of the chat
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 2000);
  };

  // Handle message reactions
  const handleReaction = (index: number, reaction: 'thumbs-up' | 'thumbs-down') => {
    setMessages(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        reaction: updated[index].reaction === reaction ? undefined : reaction,
      };
      return updated;
    });
  };

  // Handle pinning messages
  const handlePinMessage = (index: number) => {
    setMessages(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pinned: !updated[index].pinned,
      };
      return updated;
    });
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Open multimedia content
  const openMultimedia = (multimedia: { type: string; data: any }) => {
    setSelectedMultimedia(multimedia);
  };

  // Export chat as PDF
  const exportChatAsPDF = () => {
    // This would be implemented with a PDF generation library
    console.log('Exporting chat as PDF...');
    alert('Chat export functionality would be implemented here.');
  };

  // Provide the context value
  const contextValue: ChatContextType = {
    messages,
    setMessages,
    filteredMessages,
    sendMessage,
    isThinking,
    progress,
    searchQuery,
    setSearchQuery,
    handleReaction,
    handlePinMessage,
    handleSuggestionClick,
    selectedMultimedia,
    setSelectedMultimedia,
    openMultimedia,
    exportChatAsPDF,
    ticketTriggerContext,
    setTicketTriggerContext,
    messagesEndRef,
    showFileDropzone,
    setShowFileDropzone,
    pendingInput,
    setPendingInput,
    activeAgent,
    setActiveAgent,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};
// Custom hook to use the chat context
export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};