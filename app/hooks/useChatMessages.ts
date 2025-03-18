// app/hooks/useChatMessages.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { stripIndent } from '../utils/helpers';
import { processChatMessage } from '../api/advancedApi';
import { MessageType, MultimediaData } from '../types/shared';

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
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
  const lastUpdateRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const safeUpdateMessages = useCallback((updater: (prev: MessageType[]) => MessageType[]) => {
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
      content: message.text || ''
    };
  };

  const sendMessage = useCallback(async (text: string, attachments?: any[]) => {
    const isFileUpload = attachments && attachments.length > 0;
    if (!text.trim() && !isFileUpload) return;

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
          url: file.url || file.fileUrl || ''
        }))
      : undefined;

    const userMessage: MessageType = {
      sender: 'user',
      text: userMessageText,
      timestamp: new Date().toISOString(),
      attachments: userAttachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    setProgress(0);

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15;
        const newProgress = prev + increment;
        return newProgress >= 100 ? 99 : newProgress;
      });
    }, 300);

    try {
      // Convert messages to ChatHistoryItem format
      const chatHistory: ChatHistoryItem[] = messages.map(convertToChatHistoryItem);

      // Call the actual API
      const response = await processChatMessage(text, chatHistory, attachments);

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
          triggerTicket: shouldTriggerTicket
        };

        // Add attachments if they exist in the response
        if ((response as any).attachments || (response as any).data?.attachments) {
          botMessage.attachments = (response as any).attachments || (response as any).data?.attachments;
        }

        safeUpdateMessages(prev => [...prev, botMessage]);
      }, 500);    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      setIsThinking(false);
      setProgress(0);

      let errorTitle = 'Error';
      let errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      let errorSuggestions: string[] = [];

      if (error instanceof Error) {
        console.error('Error sending message:', error);
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