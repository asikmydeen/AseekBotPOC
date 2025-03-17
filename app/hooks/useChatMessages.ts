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
    onMessagesUpdate?: (messages: MessageType[]) => void;

}

export default function useChatMessages({ triggerMessage, onTriggerHandled, onMessagesUpdate }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      sender: 'bot',
      text: 'Hello! I\'m AseekBot, your AI assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
      suggestions: [        'How can you help me?'
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

   useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages);
    }
  }, [messages, onMessagesUpdate]);

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

      // Define interface for API error response
      interface ApiErrorResponse {
        error: string;
        message: string;
        details?: string;
        suggestions?: string[];
      }

      let errorTitle = 'Error';
      let errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      let errorSuggestions: string[] = [];

      // Try to extract structured error information
      if (error instanceof Error) {
        console.error('Error sending message:', error);

        // Check if this is a response error with JSON data
        if ('response' in error && error.response) {
          try {
            // Try to parse the error response as JSON
            const errorResponse = error.response as ApiErrorResponse;

            if (errorResponse.error && errorResponse.message) {
              errorTitle = errorResponse.error;
              errorMsg = errorResponse.message;

              if (errorResponse.suggestions && errorResponse.suggestions.length > 0) {
                errorSuggestions = errorResponse.suggestions;
              }
            }
          } catch (parseError) {
            // If parsing fails, fall back to the error message
            errorMsg = error.message || errorMsg;
          }
        } else {
          // For non-response errors, use the error message if available
          errorMsg = error.message || errorMsg;
        }
      } else if (typeof error === 'object' && error !== null) {
        // Handle case where error is an object but not an Error instance
        const errorObj = error as any;

        if (errorObj.error && errorObj.message) {
          errorTitle = errorObj.error;
          errorMsg = errorObj.message;

          if (errorObj.suggestions && Array.isArray(errorObj.suggestions)) {
            errorSuggestions = errorObj.suggestions;
          }
        } else if (errorObj.message) {
          errorMsg = errorObj.message;
        }
      }

      // Create a more informative error message
      const formattedErrorMsg = `**${errorTitle}**: ${errorMsg}`;

      const errorMessage: MessageType = {
        sender: 'bot',
        text: formattedErrorMsg,
        timestamp: new Date().toISOString(),
        suggestions: errorSuggestions.length > 0 ? errorSuggestions : undefined
      };

      setMessages(prev => [...prev, errorMessage]);
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
