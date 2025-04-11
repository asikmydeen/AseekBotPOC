import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from '../utils/helpers';
import { apiService } from '../utils/apiService';
import { MessageType, MultimediaData } from '../types/shared';
import { createDocumentAnalysisMessage } from '../utils/documentAnalysisUtils';
import { ProcessingStatus, WorkflowType } from '../types/status';

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
  const [chatSessionId] = useState<string>(() => {
    const storedSessionId = typeof window !== 'undefined' ? localStorage.getItem('chatSessionId') : null;
    if (storedSessionId) {
      return storedSessionId;
    }
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
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

  const [isAsyncProcessing, setIsAsyncProcessing] = useState(false);
  const [asyncStatus, setAsyncStatus] = useState<ProcessingStatus | ''>('');
  const [asyncProgress, setAsyncProgress] = useState<number>(0);
  const [processingError, setProcessingError] = useState<Error | null>(null);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const requestCancelledRef = useRef<boolean>(false);
  const processedRequestIdsRef = useRef<Set<string>>(new Set());

  const activeRequestIdsRef = useRef<Set<string>>(new Set());
  const pollIntervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      pollIntervalRefs.current.forEach(intervalId => {
        clearInterval(intervalId);
      });
      pollIntervalRefs.current.clear();
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

  const pollStatus = useCallback(async (requestId: string) => {
    if (!requestId || requestCancelledRef.current) return;
    try {
      console.log(`Polling status for request ${requestId}...`);
      const statusResponse = await apiService.checkStatus(requestId);
      console.log(`Received status for ${requestId}:`, statusResponse.status, `Progress: ${statusResponse.progress || 0}%`);
      console.log(`Status response details:`, {
        workflowType: statusResponse.workflowType,
        hasCompletion: !!statusResponse.completion,
        completionLength: statusResponse.completion?.length || 0,
        hasMessage: !!statusResponse.message,
        messageLength: statusResponse.message?.length || 0,
        hasFormattedMessage: !!statusResponse.formattedMessage,
        hasAggregatedResults: !!statusResponse.aggregatedResults
      });

      // Convert string status to ProcessingStatus enum if valid
      const status = statusResponse.status &&
        Object.values(ProcessingStatus).includes(statusResponse.status as ProcessingStatus)
        ? statusResponse.status as ProcessingStatus
        : ProcessingStatus.PROCESSING;

      setAsyncStatus(status);
      setAsyncProgress(statusResponse.progress || 0);
      if (status === ProcessingStatus.COMPLETED) {
        if (processedRequestIdsRef.current.has(requestId)) {
          console.log(`Request ${requestId} already processed, skipping duplicate message`);
          return;
        }
        processedRequestIdsRef.current.add(requestId);
        if (pollIntervalRefs.current.has(requestId)) {
          clearInterval(pollIntervalRefs.current.get(requestId)!);
          pollIntervalRefs.current.delete(requestId);
        }
        activeRequestIdsRef.current.delete(requestId);
        let pending: Record<string, unknown> = {};
        try {
          const stored = localStorage.getItem('pendingRequests');
          if (stored) {
            pending = JSON.parse(stored);
          }
        } catch (e) {}
        if (pending[requestId]) {
          delete pending[requestId];
          localStorage.setItem('pendingRequests', JSON.stringify(pending));
        }
        setIsThinking(false);
        setProgress(100);
        setIsAsyncProcessing(activeRequestIdsRef.current.size > 0);
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
        } else if (statusResponse.workflowType === 'MULTI_ANALYSIS_PROMPT') {
          console.log('Multi-analysis prompt workflow detected, using completion data...');
          console.log('Status response completion:', statusResponse.completion);
          console.log('Status response aggregatedResults:', statusResponse.aggregatedResults);

          // For MULTI_ANALYSIS_PROMPT, always use the completion field as the message text
          const messageText = statusResponse.completion || statusResponse.message || 'Processing complete.';

          botMessage = {
            sender: 'bot',
            formattedMessage: statusResponse.formattedMessage,
            text: messageText,
            timestamp: new Date().toISOString(),
            chatId: statusResponse.chatId || '',
            chatSessionId: chatSessionId,
            completion: statusResponse.completion,
            aggregatedResults: statusResponse.aggregatedResults,
            agentType: 'bid-analysis' // Mark this as a bid analysis message
          };
        } else {
          console.log('Standard workflow detected, processing response...');
          console.log('Status response formattedMessage:', statusResponse.formattedMessage);
          console.log('Status response completion:', statusResponse.completion);
          console.log('Status response aggregatedResults:', statusResponse.aggregatedResults);

          // Use the completion data if available, otherwise fall back to message
          const messageText = statusResponse.completion || statusResponse.message || 'Processing complete.';

          botMessage = {
            sender: 'bot',
            formattedMessage: statusResponse.formattedMessage,
            text: messageText,
            timestamp: new Date().toISOString(),
            chatId: statusResponse.chatId || '',
            chatSessionId: chatSessionId,
            completion: statusResponse.completion,
            aggregatedResults: statusResponse.aggregatedResults
          };
        }
        console.log('Adding message to chat history with properties:', {
          hasCompletion: !!botMessage.completion,
          completionLength: botMessage.completion?.length || 0,
          hasText: !!botMessage.text,
          textLength: botMessage.text?.length || 0,
          workflowType: statusResponse.workflowType,
          agentType: botMessage.agentType
        });
        safeUpdateMessages(prev => {
          const newMessages = [...prev, botMessage];
          console.log('Updated messages count:', newMessages.length);
          return newMessages;
        });
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (statusResponse.status === 'FAILED') {
        if (pollIntervalRefs.current.has(requestId)) {
          clearInterval(pollIntervalRefs.current.get(requestId)!);
          pollIntervalRefs.current.delete(requestId);
        }
        activeRequestIdsRef.current.delete(requestId);
        let pending: Record<string, unknown> = {};
        try {
          const stored = localStorage.getItem('pendingRequests');
          if (stored) {
            pending = JSON.parse(stored);
          }
        } catch (e) {}
        if (pending[requestId]) {
          delete pending[requestId];
          localStorage.setItem('pendingRequests', JSON.stringify(pending));
        }
        setIsThinking(false);
        setProgress(0);
        setIsAsyncProcessing(activeRequestIdsRef.current.size > 0);
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
  const sendMessageHandler = useCallback(async (text: string, attachments?: any[]) => {
    const isFileUpload = attachments && attachments.length > 0;
    if (!text.trim() && !isFileUpload) return;
    setProcessingError(null);
    requestCancelledRef.current = false;
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    pollIntervalRefs.current.forEach(intervalId => {
      clearInterval(intervalId);
    });
    pollIntervalRefs.current.clear();
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
    try {
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
      const apiSendMessage = apiService.sendMessage;
      const response = await apiSendMessage(text, chatSessionId, attachments);

      // Convert string status to ProcessingStatus enum if valid
      const status = response.status &&
        Object.values(ProcessingStatus).includes(response.status as ProcessingStatus)
        ? response.status as ProcessingStatus
        : ProcessingStatus.QUEUED;

      if (response.requestId && (status === ProcessingStatus.QUEUED || status === ProcessingStatus.PROCESSING)) {
        activeRequestIdsRef.current.add(response.requestId);
        setIsAsyncProcessing(true);
        setAsyncStatus(status);
        setAsyncProgress(response.progress || 0);
        const intervalId = setInterval(() => {
          if (response.requestId) {
            pollStatus(response.requestId);
          }
        }, 2000);
        pollIntervalRefs.current.set(response.requestId, intervalId);
        let pending: Record<string, { status: string }> = {};
        try {
          const stored = localStorage.getItem('pendingRequests');
          if (stored) {
            pending = JSON.parse(stored);
          }
        } catch (e) {}
        pending[response.requestId] = { status: response.status };
        localStorage.setItem('pendingRequests', JSON.stringify(pending));
      } else {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
        setProgress(100);
        setTimeout(() => {
          setIsThinking(false);
          setProgress(0);
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
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      pollIntervalRefs.current.forEach(intervalId => {
        clearInterval(intervalId);
      });
      pollIntervalRefs.current.clear();
      setIsThinking(false);
      setProgress(0);
      setIsAsyncProcessing(false);
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
  const refreshAsyncStatus = useCallback(() => {
    console.log(`Manually refreshing status for ${activeRequestIdsRef.current.size} active requests`);
    if (activeRequestIdsRef.current.size === 0) {
      console.log('No active requests to refresh');
      return;
    }

    // Ensure async status is set to show loading state
    setAsyncStatus('PROCESSING');

    activeRequestIdsRef.current.forEach(requestId => {
      console.log(`Triggering manual refresh for request ${requestId}`);
      pollStatus(requestId);
    });
  }, [pollStatus]);

  const cancelAsyncRequest = useCallback(() => {
    requestCancelledRef.current = true;
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    pollIntervalRefs.current.forEach(intervalId => {
      clearInterval(intervalId);
    });
    pollIntervalRefs.current.clear();
    setIsThinking(false);
    setProgress(0);
    setIsAsyncProcessing(false);

    // Remove all pending requests from localStorage
    try {
      localStorage.removeItem('pendingRequests');
      console.log('Cleared all pending requests from localStorage');
    } catch (e) {
      console.error('Error clearing pendingRequests from localStorage:', e);
    }

    console.log('Async request cancelled');
  }, []);

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
    sendMessageHandler(suggestion);
  }, [sendMessageHandler]);

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
    try {
      const stored = localStorage.getItem('pendingRequests');
      if (stored) {
        const pending = JSON.parse(stored);
        const pendingRequestIds = Object.keys(pending);

        pendingRequestIds.forEach(requestId => {
          if (!activeRequestIdsRef.current.has(requestId)) {
            activeRequestIdsRef.current.add(requestId);

            // Immediately call pollStatus for the pending request
            console.log(`Immediately polling status for pending request ${requestId} after page load`);
            pollStatus(requestId);

            const intervalId = setInterval(() => {
              pollStatus(requestId);
            }, 2000);
            pollIntervalRefs.current.set(requestId, intervalId);
          }
        });

        // If there are pending requests, update the UI state immediately
        if (pendingRequestIds.length > 0) {
          setIsThinking(true);
          setIsAsyncProcessing(true);
          setAsyncStatus(ProcessingStatus.PROCESSING); // Ensure status is set to show loading state
          console.log(`Found ${pendingRequestIds.length} pending requests, updating UI state`);
        }
      }
    } catch (e) {
      console.error('Error resuming polling from localStorage:', e);
    }
  }, [pollStatus]);

  useEffect(() => {
    if (triggerMessage) {
      console.log('Received triggerMessage in useChatMessages:', triggerMessage);
      sendMessageHandler(triggerMessage);
      onTriggerHandled();
    }
  }, [triggerMessage, onTriggerHandled, sendMessageHandler]);

  return {
    messages,
    setMessages,
    filteredMessages,
    sendMessage: sendMessageHandler,
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
    isAsyncProcessing,
    asyncProgress,
    asyncStatus,
    refreshAsyncStatus,
    cancelAsyncRequest,
    processingError
  };
}
