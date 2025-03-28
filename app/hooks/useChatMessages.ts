// app/hooks/useChatMessages.ts - Fixed version
import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from '../utils/helpers';
import { processChatMessage, startAsyncChatProcessing, startAsyncDocumentAnalysis } from '../api/advancedApi';
import { MessageType, MultimediaData } from '../types/shared';
import { useAsyncProcessing } from './useAsyncProcessing';
import {
  createDocumentAnalysisMessage,
} from '../utils/documentAnalysisUtils';

// Define the ChatHistoryItem interface again in useChatMessages.ts to match the import
interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  chatId: string; // Add the missing property
  chatSessionId?: string; // Add chatSessionId property
}

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
  // Get or create a chat session ID that persists for the entire chat session
  const [chatSessionId] = useState<string>(() => {
    // Try to get existing chatSessionId from localStorage
    const storedSessionId = typeof window !== 'undefined' ? localStorage.getItem('chatSessionId') : null;

    if (storedSessionId) {
      return storedSessionId;
    }

    // Create a new chatSessionId if none exists
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    // Store in localStorage for persistence across page refreshes
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSessionId', newSessionId);
    }

    return newSessionId;
  });
  const [messages, setMessages] = useState<MessageType[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return initialMessages;
    }
    return [
      {
        sender: 'bot',
        text: 'Hello! I\'m AseekBot, your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString(),
        suggestions: ['How can you help me?'],
        chatId: Date.now().toString(),
        chatSessionId: chatSessionId
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

  // New state for async processing
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<Error | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const requestCancelledRef = useRef<boolean>(false);

  // Set up the async processing hook for status monitoring with error handling
  const {
    result: asyncResult,
    status: asyncStatus,
    progress: asyncProgress,
    error: asyncError,
    refreshStatus,
    hasErrored
  } = useAsyncProcessing(currentRequestId, {
    pollingInterval: 2000,
    onStatusChange: (status) => {
      // Don't process if request was cancelled
      if (requestCancelledRef.current) return;

      // Update progress based on async status
      if (status.progress) {
        setProgress(status.progress);
      }

      // When processing completes, add the bot message
      if (status.status === 'COMPLETED' && status.result) {
        console.log('Status update received:', status);

        setIsThinking(false);
        setProgress(100);  // Set to 100% when completed

        // Clear request ID after processing
        setCurrentRequestId(null);
        setIsAsyncProcessing(false);

        const botMessage = createDocumentAnalysisMessage(status, chatSessionId);

        // Add the bot message to the messages state
        safeUpdateMessages(prev => [...prev, botMessage]);

        // Scroll to the bottom to show the new message
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Handle error condition (keep existing error handling)
      if (status.status === 'FAILED') {
        setIsThinking(false);
        setProgress(0);
        setIsAsyncProcessing(false);

        // Don't reset currentRequestId to null here - this helps prevent repeated polling

        let errorMessage = status.error?.message || 'An error occurred during processing.';
        setProcessingError(new Error(errorMessage));

        const errorBotMessage: MessageType = {
          sender: 'bot',
          text: `**Error**: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          isError: true,
          chatId: '',
          chatSessionId: chatSessionId
        };

        safeUpdateMessages(prev => [...prev, errorBotMessage]);
      }
    }
  });

  // Effect to handle async error state
  useEffect(() => {
    if (hasErrored && currentRequestId) {
      console.log('Detected error state, cleaning up async processing');
      // Clean up the async processing state when an error occurs
      setCurrentRequestId(null);

      // If we haven't already shown an error message, show one
      if (!processingError) {
        const errorMessage = asyncError?.message || 'An error occurred during processing.';
        setProcessingError(new Error(errorMessage));

        const errorBotMessage: MessageType = {
          sender: 'bot',
          text: `**Error**: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          isError: true,
          chatId: '',
          chatSessionId: chatSessionId
        };

        safeUpdateMessages(prev => [...prev, errorBotMessage]);
      }
    }
  }, [hasErrored, asyncError, currentRequestId, processingError]);

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      requestCancelledRef.current = true;
    };
  }, []);

  const safeUpdateMessages = useCallback((updater: (prev: MessageType[]) => MessageType[]) => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;
    setMessages(prev => {
      const newMessages = updater(prev);
      lastUpdateRef.current = JSON.stringify(newMessages);
      return newMessages;
    });
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

  // Convert MessageType to ChatHistoryItem for API
  const convertToChatHistoryItem = (message: MessageType): ChatHistoryItem => {
  return {
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.text || '',
    chatId: message.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    chatSessionId: message.chatSessionId || chatSessionId
  };
};

  // Enhanced sendMessage that supports async processing with better error handling
  const sendMessage = useCallback(async (text: string, attachments?: any[]) => {
    const isFileUpload = attachments && attachments.length > 0;
    if (!text.trim() && !isFileUpload) return;

    // Reset any previous error state
    setProcessingError(null);
    requestCancelledRef.current = false;

    // Clear any existing progress interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    let userMessageText = text;
    if (isFileUpload) {
      const fileNames = attachments.map(file => file.name).join(', ');
      if (text.trim()) {
        userMessageText = `${text} [Files: ${fileNames}]`;
      } else {
        userMessageText = `Uploaded files: ${fileNames}`;
      }
    }

    const userAttachments = isFileUpload
      ? attachments.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          contentType: file.type,
          url: file.url || file.fileUrl || ''
        }))
      : undefined;

    const userMessage: MessageType = {
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString(),
      attachments: userAttachments,
      chatId: '',
      chatSessionId: chatSessionId
    };

    safeUpdateMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setProgress(0);

    // Determine if we should use async processing
    const isComplexRequest = text.length > 500 || isFileUpload;
    const isDocumentAnalysis = isFileUpload && (
      text.toLowerCase().includes('analyze') ||
      text.toLowerCase().includes('document') ||
      text.toLowerCase().includes('extract') ||
      text.toLowerCase().includes('summarize')
    );

    try {
      // Convert messages to ChatHistoryItem format
      const chatHistory: ChatHistoryItem[] = messages.map(convertToChatHistoryItem);

      if (isComplexRequest) {
        // Use async processing
        let response;

        if (isDocumentAnalysis && isFileUpload) {
          // Start document analysis workflow
          response = await startAsyncDocumentAnalysis(attachments!, text, chatSessionId);
        } else {
          // Start async chat processing
          response = await startAsyncChatProcessing(text, chatHistory, attachments, chatSessionId);
        }

        if (response.requestId) {
          // Set up for async monitoring
          setCurrentRequestId(response.requestId);
          setIsAsyncProcessing(true);

          // Initial progress setup
          setProgress(10);

          // Start the progress animation, but with a safety mechanism to prevent constant updates
          progressInterval.current = setInterval(() => {
            if (requestCancelledRef.current) {
              if (progressInterval.current) {
                clearInterval(progressInterval.current);
                progressInterval.current = null;
              }
              return;
            }

            setProgress(prev => {
              // Don't exceed 95% for async operations until completion
              return prev < 95 ? prev + (Math.random() * 1) : 95;
            });
          }, 1000);
        } else {
          throw new Error('No request ID received for async processing');
        }
      } else {
        // Use standard processing for simple requests
        progressInterval.current = setInterval(() => {
          if (requestCancelledRef.current) {
            if (progressInterval.current) {
              clearInterval(progressInterval.current);
              progressInterval.current = null;
            }
            return;
          }

          setProgress(prev => {
            const increment = Math.random() * 15;
            const newProgress = prev + increment;
            return newProgress >= 100 ? 99 : newProgress;
          });
        }, 300);

        // Call the API
        const response = await processChatMessage(text, chatHistory, attachments, chatSessionId);

        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }

        setProgress(100);

        setTimeout(() => {
          setIsThinking(false);
          setProgress(0);

          // Check for ticket trigger in response
          const shouldTriggerTicket = 'triggerTicket' in response && (response as { triggerTicket: boolean }).triggerTicket === true;

          if (shouldTriggerTicket) {
            const userLastMessage = messages.filter(msg => msg.sender === 'user').pop()?.text || '';
            setTicketTriggerContext(userLastMessage);
          } else {
            setTicketTriggerContext(null);
          }

          // Create bot message from response
          const botMessage: MessageType = {
            sender: 'bot',
            text: (response as any).message || (response as any).data?.message || 'No response received',
            timestamp: (response as any).timestamp || new Date().toISOString(),
            suggestions: (response as any).suggestions || (response as any).data?.suggestions || [],
            multimedia: (response as any).multimedia || (response as any).data?.multimedia,
            report: (response as any).report || (response as any).data?.report,
            triggerTicket: shouldTriggerTicket,
            chatId: '',
            chatSessionId: chatSessionId
          };

          // Add attachments if they exist in the response
          if ((response as any).attachments || (response as any).data?.attachments) {
            botMessage.attachments = (response as any).attachments || (response as any).data?.attachments;
          }

          safeUpdateMessages(prev => [...prev, botMessage]);
        }, 500);
      }
    } catch (error) {
      // Clean up any ongoing intervals
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setIsThinking(false);
      setProgress(0);
      setIsAsyncProcessing(false);
      setCurrentRequestId(null);
      setProcessingError(error instanceof Error ? error : new Error('Unknown error'));
      requestCancelledRef.current = true;

      console.error('Error sending message:', error);

      let errorTitle = 'Error';
      let errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      let errorSuggestions: string[] = [];

      if (error instanceof Error) {
        errorMsg = error.message || errorMsg;
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
        suggestions: errorSuggestions.length > 0 ? errorSuggestions : undefined,
        isError: true,
        chatId: '',
        chatSessionId: chatSessionId
      };

      safeUpdateMessages(prev => [...prev, errorMessage]);
    }

  }, [messages, safeUpdateMessages]);
  // Function to cancel ongoing async request - critical for preventing infinite loops
  const cancelAsyncRequest = useCallback(() => {
    // Mark the request as cancelled
    requestCancelledRef.current = true;

    // Clear any ongoing intervals
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    // Reset the processing states
    setIsThinking(false);
    setProgress(0);
    setIsAsyncProcessing(false);

    // Don't immediately clear currentRequestId to prevent new polling attempts
    // It will be cleared on the next message or when component unmounts

    console.log('Async request cancelled');
  }, []);

  // Other handlers remain unchanged
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
      const formattedText = marked.parse(msg.text || '');

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

      return stripIndent(`
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
      `);
    }).join('');

    const html = stripIndent(`
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
    `);

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
    messagesEndRef,
    // New properties for async processing
    isAsyncProcessing,
    currentRequestId,
    asyncProgress,
    asyncStatus,
    refreshAsyncStatus: refreshStatus,
    cancelAsyncRequest,
    processingError
  };
}
