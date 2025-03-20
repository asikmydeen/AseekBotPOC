"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Message from '../Message';
import { MessageType, MultimediaData } from '../../types/shared';

const TypingIndicator = ({ isDarkMode, isAsync = false }: { isDarkMode: boolean, isAsync?: boolean }) => {
  return (
    <div className={`p-3 rounded-lg inline-flex items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <div className="font-bold text-sm mr-2">AseekBot {isAsync ? '(Processing)' : ''}</div>
      <div className="flex space-x-1">
        <motion.div
          className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
        />
        <motion.div
          className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
        />
        <motion.div
          className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
        />
      </div>
    </div>
  );
};

const ProgressBar = ({ progress, isDarkMode }: { progress: number; isDarkMode: boolean }) => {
  return (
    <div className="w-full max-w-[200px] h-1.5 bg-gray-300 rounded-full overflow-hidden mt-1">
      <motion.div
        className={`h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
};

const AsyncStatusIndicator = ({ status, progress, isDarkMode, onRefresh }: {
  status: string,
  progress: number,
  isDarkMode: boolean,
  onRefresh: () => void
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className={`text-xs mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Status: <span className="font-bold">{status}</span>
        </span>
        <button
          onClick={onRefresh}
          className={`text-xs px-2 py-1 rounded-md ml-2 ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}
        >
          Refresh
        </button>
      </div>
      <ProgressBar progress={progress} isDarkMode={isDarkMode} />
    </div>
  );
};

interface MessageListProps {
  messages: MessageType[];
  isThinking: boolean;
  progress: number;
  isDarkMode: boolean;
  openMultimedia: (multimedia: { type: 'video' | 'graph' | 'image'; data: MultimediaData }) => void;
  handleReaction: (index: number, reaction: 'thumbs-up' | 'thumbs-down') => void;
  handlePinMessage: (index: number) => void;
  messagesEndRef?: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  // New async props
  isAsyncProcessing?: boolean;
  asyncProgress?: number;
  asyncStatus?: string;
  onRefreshStatus?: () => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isThinking,
  progress,
  isDarkMode,
  openMultimedia,
  handleReaction,
  handlePinMessage,
  messagesEndRef,
  // New async props
  isAsyncProcessing = false,
  asyncProgress = 0,
  asyncStatus = '',
  onRefreshStatus = () => { }
}) => {
  // Scroll to bottom when messages change or when isThinking changes
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, messagesEndRef]);

  return (
    <div className="flex flex-col space-y-4">
      {messages.length === 0 ? (
        <div className={`text-center p-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <h2 className="text-xl font-semibold mb-2">Welcome to AseekBot!</h2>
          <p>Start a conversation or ask a question to get started.</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <div id={`message-${message.timestamp}`} key={`${message.timestamp}-${index}`}>
            <Message
              key={`${message.timestamp}-${index}`}
              message={message}
              isDarkMode={isDarkMode}
              onMultimediaClick={openMultimedia}
              onReact={(reaction) => handleReaction(index, reaction)}
              onPin={() => handlePinMessage(index)}
              onDownload={() => {/* No-op download handler */ }}
              showCitations={true}
            />
          </div>
        ))
      )}

      {isThinking && (
        <div className={`flex flex-col ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <div className="flex items-start space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <span className="text-xs font-bold">AB</span>
            </div>
            <div className="flex flex-col">
              <TypingIndicator isDarkMode={isDarkMode} isAsync={isAsyncProcessing} />
              {isAsyncProcessing && asyncStatus ? (
                <AsyncStatusIndicator
                  status={asyncStatus}
                  progress={asyncProgress || progress}
                  isDarkMode={isDarkMode}
                  onRefresh={onRefreshStatus}
                />
              ) : (
                progress > 0 && <ProgressBar progress={progress} isDarkMode={isDarkMode} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* This div is used to scroll to the bottom of the chat */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;