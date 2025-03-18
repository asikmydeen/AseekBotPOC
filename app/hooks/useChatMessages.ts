// app/hooks/useChatMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from 'common-tags';
import { processChatMessage } from '../api/advancedApi';
import { MessageType, MultimediaData } from '../types/shared';

interface UseChatMessagesProps {
  triggerMessage: string | null;
  onTriggerHandled: () => void;
  onMessagesUpdate?: (messages: MessageType[]) => void;
  initialMessages?: MessageType[];
}

export default function useChatMessages({
  triggerMessage,
  onTriggerHandled,
  onMessagesUpdate,
  initialMessages = []
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<MessageType[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        sender: 'bot',
        text: 'Hello! I\'m AseekBot, your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString(),
        suggestions: ['How can you help me?']
      }
    ];
  });

  const [isThinking, setIsThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMultimedia, setSelectedMultimedia] = useState<{
    type: 'video' | 'graph' | 'image';
    data: MultimediaData;
  } | null>(null);
  const [ticketTriggerContext, setTicketTriggerContext] = useState<string | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  // Stores the last serialized state of messages to prevent redundant updates
  const lastUpdateRef = useRef<string>('');
  // Flag to prevent circular updates when modifying messages
  const isUpdatingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /**
   * Helper function to safely update messages while preventing circular updates
   * @param updater Function that returns the new messages array
   */
  const safeUpdateMessages = useCallback((updater: (prev: MessageType[]) => MessageType[]) => {
    // Mark as updating to prevent circular updates
    isUpdatingRef.current = true;
    setMessages(prev => {
      const newMessages = updater(prev);
      // Store serialized state for comparison
      lastUpdateRef.current = JSON.stringify(newMessages);
      return newMessages;
    });
    // Reset updating flag after a short delay to allow state to settle
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      lastUpdateRef.current = JSON.stringify(initialMessages);
      setMessages(initialMessages);
    }
  }, []);

  // Synchronize messages with parent component when they change
  // Uses the isUpdatingRef flag to prevent circular updates
  useEffect(() => {
    if (onMessagesUpdate && !isUpdatingRef.current) {
      const currentMessagesStr = JSON.stringify(messages);
      if (currentMessagesStr !== lastUpdateRef.current) {
        lastUpdateRef.current = currentMessagesStr;
        onMessagesUpdate(messages);
      }
    }
  }, [messages, onMessagesUpdate]);

  const filteredMessages = searchQuery
    ? messages.filter(msg =>
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.report?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.report?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  const sendMessage = useCallback(async (text: string, attachments?: any[]) => {
    const isFileUpload = attachments && attachments.length > 0;

    // Don't proceed if there's no text and no files
    if (!text.trim() && !isFileUpload) return;

    // Create a proper user message that includes both file info and text
    let userMessageText = text;

    // If there are attachments, include their names in the message
    if (isFileUpload) {
      const fileNames = attachments.map(file => file.name).join(', ');
      if (text.trim()) {
        // If text is provided, combine it with file names
        userMessageText = `${text} [Files: ${fileNames}]`;
      } else {
        // If no text, just show the file names
        userMessageText = `Uploaded files: ${fileNames}`;
      }
    }

    // Create attachments array for user message display
    const userAttachments = isFileUpload
      ? attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url || file.fileUrl || ''
        }))
      : undefined;

    const userMessage: MessageType = {
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString(),
      attachments: userAttachments
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
          const userLastMessage = messages.filter(msg => msg.sender === 'user').pop()?.text || '';
          setTicketTriggerContext(userLastMessage);
        } else {
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

        safeUpdateMessages(prev => [...prev, botMessage]);
      }, 500);
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setIsThinking(false);
      setProgress(0);

      interface ApiErrorResponse {
        error: string;
        message: string;
        details?: string;
        suggestions?: string[];
      }

      let errorTitle = 'Error';
      let errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      let errorSuggestions: string[] = [];

      if (error instanceof Error) {
        console.error('Error sending message:', error);

        if ('response' in error && error.response) {
          try {
            const errorResponse = error.response as ApiErrorResponse;

            if (errorResponse.error && errorResponse.message) {
              errorTitle = errorResponse.error;
              errorMsg = errorResponse.message;

              if (errorResponse.suggestions && errorResponse.suggestions.length > 0) {
                errorSuggestions = errorResponse.suggestions;
              }
            }
          } catch (parseError) {
            errorMsg = error.message || errorMsg;
          }
        } else {
          errorMsg = error.message || errorMsg;
        }
      } else if (typeof error === 'object' && error !== null) {
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

      const formattedErrorMsg = `**${errorTitle}**: ${errorMsg}`;

      const errorMessage: MessageType = {
        sender: 'bot',
        text: formattedErrorMsg,
        timestamp: new Date().toISOString(),
        suggestions: errorSuggestions.length > 0 ? errorSuggestions : undefined
      };

      safeUpdateMessages(prev => [...prev, errorMessage]);
    }
  }, [messages, safeUpdateMessages]);

  const handleReaction = useCallback((index: number, reaction: 'thumbs-up' | 'thumbs-down') => {
    safeUpdateMessages(prev =>
      prev.map((msg, i) => i === index ? { ...msg, reaction } : msg)
    );
  }, [safeUpdateMessages]);

  const handlePinMessage = useCallback((index: number) => {
    safeUpdateMessages(prev =>
      prev.map((msg, i) => i === index ? { ...msg, pinned: !msg.pinned } : msg)
    );
  }, [safeUpdateMessages]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const openMultimedia = useCallback((multimedia: { type: 'video' | 'graph' | 'image'; data: MultimediaData }) => {
    setSelectedMultimedia(multimedia);
  }, []);

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

  useEffect(() => {
    if (triggerMessage) {
      sendMessage(triggerMessage);
      onTriggerHandled();
    }
  }, [triggerMessage, sendMessage, onTriggerHandled]);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  return {
    messages,
    setMessages,
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
    ticketTriggerContext,
    messagesEndRef
  };
}