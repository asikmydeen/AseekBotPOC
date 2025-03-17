import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from 'common-tags';
import { processChatMessage } from '../api/advancedApi';

// Define multimedia data types
export interface VideoData {
  url: string;
  title?: string;
  duration?: number;
}

export interface GraphData {
  data: Record<string, unknown>;
  config?: Record<string, unknown>;
  type?: string;
}

export interface ImageData {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export type MultimediaData = VideoData | GraphData | ImageData;

export interface MessageType {
  agentType?: string;
  sender: 'user' | 'bot';
  text: string;
  multimedia?: { type: 'video' | 'graph' | 'image'; data: MultimediaData };
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
}

interface UseChatMessagesProps {
  triggerMessage: string | null;
  onTriggerHandled: () => void;
}

export default function useChatMessages({ triggerMessage, onTriggerHandled }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      sender: 'bot',
      text: 'Hello! I\'m AseekBot, your AI assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'Tell me about Aseek',
        'How can you help me?',
        'What data sources do you use?'
      ]
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMultimedia, setSelectedMultimedia] = useState<{
    type: 'video' | 'graph' | 'image';
    data: MultimediaData;
  } | null>(null);
  const [ticketTriggerContext, setTicketTriggerContext] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Filter messages based on search query
  const filteredMessages = searchQuery
    ? messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.report?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.report?.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Handle sending messages
  const sendMessage = useCallback(async (text: string, attachments?: File[]) => {
    const isFileUpload = attachments && attachments.length > 0;

    if (!text.trim() && !isFileUpload) return;

    const userMessage: MessageType = {
      sender: 'user',
      text: isFileUpload ? `Uploaded file: ${attachments?.map(f => f.name).join(', ')}` : text,
      timestamp: new Date().toISOString()
    };

    // Add the user message to the messages array
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setProgress(0);

    // Simulate progress
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15;
        const newProgress = prev + increment;
        return newProgress >= 100 ? 99 : newProgress;
      });
    }, 300);

    try {
      // Pass the updated messages array as history
      const response = await processChatMessage(text, messages, attachments);

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setProgress(100);

      setTimeout(() => {
        setIsThinking(false);
        setProgress(0);

        // Check if this is a fallback response that should trigger a ticket
        if (response.triggerTicket) {
          // Store the user's last message as context for the ticket
          const userLastMessage = messages.filter(msg => msg.sender === 'user').pop()?.text || '';
          setTicketTriggerContext(userLastMessage);
        } else {
          // Reset ticket trigger context if not a fallback response
          setTicketTriggerContext(null);
        }

        // Create bot message from response
        const botMessage: MessageType = {
          sender: 'bot',
          text: response.message,
          timestamp: response.timestamp || new Date().toISOString(),
          suggestions: response.suggestions || [],
          multimedia: response.multimedia,
          report: response.report,
          triggerTicket: response.triggerTicket
        };

        // Add attachments if they exist in the response
        if (response.attachments && response.attachments.length > 0) {
          botMessage.attachments = response.attachments;
        }

        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setIsThinking(false);
      setProgress(0);

      const errorMessage: MessageType = {
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      console.error('Error sending message:', error);
    }
  }, [messages]);  // Handle reactions to messages
  const handleReaction = useCallback((index: number, reaction: 'thumbs-up' | 'thumbs-down') => {
    setMessages(prev =>
      prev.map((msg, i) =>
        i === index ? { ...msg, reaction } : msg
      )
    );
  }, []);

  // Handle pinning messages
  const handlePinMessage = useCallback((index: number) => {
    setMessages(prev =>
      prev.map((msg, i) =>
        i === index ? { ...msg, pinned: !msg.pinned } : msg
      )
    );
  }, []);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  // Open multimedia content
  const openMultimedia = useCallback((multimedia: { type: 'video' | 'graph' | 'image'; data: MultimediaData }) => {
    setSelectedMultimedia(multimedia);
  }, []);

  // Export chat as PDF
  const exportChatAsPDF = useCallback(() => {
    const chatContent = messages.map(msg => {
      const sender = msg.sender === 'user' ? 'You' : 'AseekBot';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const formattedText = marked.parse(msg.text);

      let reportContent = '';
      if (msg.report) {
        reportContent = `
          <div class="report">
            <h3>${msg.report.title}</h3>
            <div>${marked.parse(msg.report.content)}</div>
            ${msg.report.citations ?
              `<div class="citations">
                <h4>Citations</h4>
                <ul>${msg.report.citations.map(c => `<li>${c}</li>`).join('')}</ul>
              </div>` :
              ''}
          </div>
        `;
      }

      return stripIndent`
        <div class="message ${msg.sender}">
          <div class="message-header">
            <strong>${sender}</strong>
            <span class="time">${time}</span>
          </div>
          <div class="message-content">
            ${formattedText}
            ${reportContent}
          </div>
        </div>
      `;
    }).join('');

    const html = stripIndent`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AseekBot Chat Export</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .message { margin-bottom: 20px; padding: 10px; border-radius: 5px; }
          .user { background-color: #f0f0f0; }
          .bot { background-color: #e6f7ff; }
          .message-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .time { color: #666; font-size: 0.8em; }
          .report { margin-top: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          .citations { margin-top: 10px; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <h1>AseekBot Chat Export</h1>
        <p>Exported on ${new Date().toLocaleString()}</p>
        <div class="chat-container">
          ${chatContent}
        </div>
      </body>
      </html>
    `;

    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
      margin: 10,
      filename: `aseekbot-chat-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
  }, [messages]);

  // Handle initial trigger message
  useEffect(() => {
    if (triggerMessage) {
      sendMessage(triggerMessage);
      onTriggerHandled();
    }
  }, [triggerMessage, sendMessage, onTriggerHandled]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return {
    messages,
    filteredMessages,
    sendMessage,
    isThinking,
    progress,
    handleReaction,
    handlePinMessage,
    handleSuggestionClick,
    openMultimedia,
    selectedMultimedia,
    setSelectedMultimedia,
    searchQuery,
    setSearchQuery,
    exportChatAsPDF,
    ticketTriggerContext
  };
}
