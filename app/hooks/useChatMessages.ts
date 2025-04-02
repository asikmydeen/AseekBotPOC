// app/hooks/useChatMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from '../utils/helpers';
import { sendMessage, checkStatus } from '../api/advancedApi';
import { MessageType, MultimediaData } from '../types/shared';
import { createDocumentAnalysisMessage } from '../utils/documentAnalysisUtils';

// Define the ChatHistoryItem interface
interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  chatId: string;
  chatSessionId?: string;
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

  // State for async processing
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);
  const [asyncStatus, setAsyncStatus] = useState<string>('');
  const [asyncProgress, setAsyncProgress] = useState<number>(0);
  const [processingError, setProcessingError] = useState<Error | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const requestCancelledRef = useRef<boolean>(false);
  const statusPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedRequestIdsRef = useRef<Set<string>>(new Set());

  // Clean up interval when component unmounts
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      if (statusPollIntervalRef.current) {
        clearInterval(statusPollIntervalRef.current);
        statusPollIntervalRef.current = null;
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

        // Check for document analysis messages before passing to parent
        const hasDocAnalysis = messages.some(msg =>
          msg.text?.includes('## Document Analysis:') ||
          msg.agentType === 'bid-analysis'
        );

        if (hasDocAnalysis) {
          console.log('Passing document analysis message to parent component');
          console.log('Document analysis sections present:',
            messages.filter(msg => msg.agentType === 'bid-analysis')
              .map(msg => ({
                hasKeyPoints: msg.text?.includes('### Key Points') || false,
                hasRecommendations: msg.text?.includes('### Recommendations') || false,
                hasNextSteps: msg.text?.includes('### Next Steps') || false
              }))
          );
        }

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

  // Poll status endpoint for updates
  const pollStatus = useCallback(async (requestId: string) => {
    if (!requestId || requestCancelledRef.current) return;

    try {
      const statusResponse = await checkStatus(requestId);

      // Update async status and progress
      setAsyncStatus(statusResponse.status || 'PROCESSING');
      setAsyncProgress(statusResponse.progress || 0);

      // Handle completed status
      if (statusResponse.status === 'COMPLETED') {
        // Check if this request has already been processed
        if (processedRequestIdsRef.current.has(requestId)) {
          console.log(`Request ${requestId} already processed, skipping duplicate message`);
          return;
        }
        processedRequestIdsRef.current.add(requestId);

        // Clean up polling interval
        if (statusPollIntervalRef.current) {
          clearInterval(statusPollIntervalRef.current);
          statusPollIntervalRef.current = null;
        }

        setIsThinking(false);
        setProgress(100);
        setIsAsyncProcessing(false);
        setCurrentRequestId(null);

        // Create appropriate bot message based on workflow type
        let botMessage: MessageType;

        if (statusResponse.workflowType === 'DOCUMENT_ANALYSIS') {
          console.log('Document analysis workflow detected, processing insights...');
          console.log('Status response structure:', JSON.stringify(statusResponse, null, 2).substring(0, 500) + '...');

          botMessage = createDocumentAnalysisMessage(statusResponse, chatSessionId);

          console.log('Document analysis message created with text length:', botMessage.text.length);
          console.log('Message contains insights sections:',
            botMessage.text.includes('### Summary'),
            botMessage.text.includes('### Key Points'),
            botMessage.text.includes('### Recommendations'),
            botMessage.text.includes('### Next Steps')
          );
        } else {
          // Debug log to check for formattedMessage
          console.log('Status response formattedMessage:', statusResponse.formattedMessage);

          // Create a standard bot message for other workflow types
          botMessage = {
            sender: 'bot',
            formattedMessage: statusResponse.formattedMessage,
            text: statusResponse.message || 'Processing complete.',
            timestamp: new Date().toISOString(),
            chatId: statusResponse.chatId || '',
            chatSessionId: chatSessionId
          };
        }

        // Add the bot message to the chat
        console.log('Adding document analysis message to chat history');
        safeUpdateMessages(prev => {
          const newMessages = [...prev, botMessage];
          console.log('Updated messages count:', newMessages.length);
          return newMessages;
        });

        // Scroll to bottom
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }

      // Handle failed status
      else if (statusResponse.status === 'FAILED') {
        // Clean up polling interval
        if (statusPollIntervalRef.current) {
          clearInterval(statusPollIntervalRef.current);
          statusPollIntervalRef.current = null;
        }

        setIsThinking(false);
        setProgress(0);
        setIsAsyncProcessing(false);
        setCurrentRequestId(null);

        let errorMessage = 'Processing failed.';
        if (typeof statusResponse.error === 'string') {
          errorMessage = statusResponse.error;
        } else if (statusResponse.error && typeof statusResponse.error === 'object' && 'message' in statusResponse.error) {
          errorMessage = (statusResponse.error as { message: string }).message || errorMessage;
        }

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
    } catch (error) {
      console.error('Error polling status:', error);
    }
  }, [chatSessionId, safeUpdateMessages]);
  // Send a message using the new unified API endpoint
  const sendMessage = useCallback(async (text: string, attachments?: any[]) => {
    const isFileUpload = attachments && attachments.length > 0;
    if (!text.trim() && !isFileUpload) return;

    // Reset any previous error state
    setProcessingError(null);
    requestCancelledRef.current = false;

    // Clear any existing intervals
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (statusPollIntervalRef.current) {
      clearInterval(statusPollIntervalRef.current);
      statusPollIntervalRef.current = null;
    }

    // Create user message text
    let userMessageText = text;
    if (isFileUpload) {
      const fileNames = attachments.map(file => file.name).join(', ');
      if (text.trim()) {
        userMessageText = `${text} [Files: ${fileNames}]`;
      } else {
        userMessageText = `Uploaded files: ${fileNames}`;
      }
    }

    // Create attachments array for the message
    const userAttachments = isFileUpload
      ? attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        contentType: file.type,
        url: file.url || file.fileUrl || ''
      }))
      : undefined;

    // Add user message to the chat
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

    try {
      // Set up progress animation
      progressInterval.current = setInterval(() => {
        if (requestCancelledRef.current) {
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
          }
          return;
        }

        setProgress(prev => {
          const increment = Math.random() * 10;
          return prev < 90 ? prev + increment : 90;
        });
      }, 500);

      // Import the sendMessage function from the advancedApi
      const { sendMessage: apiSendMessage } = await import('../api/advancedApi');

      // Send the message to the API
      const response = await apiSendMessage(text, chatSessionId, attachments);

      // Check if this is an async request that requires polling
      if (response.requestId && (response.status === 'QUEUED' || response.status === 'PROCESSING')) {
        // This is an async request, set up polling
        setCurrentRequestId(response.requestId);
        setIsAsyncProcessing(true);
        setAsyncStatus(response.status);
        setAsyncProgress(response.progress || 0);

        // Clear the processed request IDs for the new async request
        processedRequestIdsRef.current.clear();

        // Start polling for status updates
        statusPollIntervalRef.current = setInterval(() => {
          if (response.requestId) {
            pollStatus(response.requestId);
          }
        }, 2000); // Poll every 2 seconds
        // Don't add a bot message yet, it will be added when processing completes
      } else {
        // This is a synchronous request with immediate response
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }

        setProgress(100);

        // Add the bot response message
        setTimeout(() => {
          setIsThinking(false);
          setProgress(0);

          // Create bot message from response
          const botMessage: MessageType = {
            sender: 'bot',
            formattedMessage: response.formattedMessage || response.formattedResponse,
            text: response.message || 'No response received',
            timestamp: response.timestamp || new Date().toISOString(),
            suggestions: response.suggestions || [],
            multimedia: response.multimedia,
            report: response.report,
            chatId: response.chatId || '',
            chatSessionId: chatSessionId
          };

          safeUpdateMessages(prev => [...prev, botMessage]);
        }, 500);
      }
    } catch (error) {
      // Handle errors
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      if (statusPollIntervalRef.current) {
        clearInterval(statusPollIntervalRef.current);
        statusPollIntervalRef.current = null;
      }

      setIsThinking(false);
      setProgress(0);
      setIsAsyncProcessing(false);
      setCurrentRequestId(null);

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
  }, [chatSessionId, safeUpdateMessages, pollStatus]);

  // Function to manually refresh the status
  const refreshAsyncStatus = useCallback(() => {
    if (currentRequestId && isAsyncProcessing) {
      pollStatus(currentRequestId);
    }
  }, [currentRequestId, isAsyncProcessing, pollStatus]);

  // Function to cancel an ongoing async request
  const cancelAsyncRequest = useCallback(() => {
    // Mark the request as cancelled
    requestCancelledRef.current = true;

    // Clear any ongoing intervals
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    if (statusPollIntervalRef.current) {
      clearInterval(statusPollIntervalRef.current);
      statusPollIntervalRef.current = null;
    }

    // Reset the processing states
    setIsThinking(false);
    setProgress(0);
    setIsAsyncProcessing(false);

    // Don't immediately clear currentRequestId to prevent new polling attempts
    setTimeout(() => {
      setCurrentRequestId(null);
    }, 500);

    console.log('Async request cancelled');
  }, []);

  // Other handlers
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
  }, []);

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
  }, [triggerMessage, onTriggerHandled]);

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
    // Async processing properties
    isAsyncProcessing,
    currentRequestId,
    asyncProgress,
    asyncStatus,
    refreshAsyncStatus,
    cancelAsyncRequest,
    processingError
  };
}
