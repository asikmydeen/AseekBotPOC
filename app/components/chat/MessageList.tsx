// Enhanced MessageList.tsx
"use client";
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { FaRobot, FaUser } from 'react-icons/fa';
import Message from '../Message';
import { MessageType, MultimediaData } from '../../types/shared';
import { EnhancedTypingIndicator, messageAnimations } from './EnhancedUIComponents';

// Enhanced Empty State Component
const EmptyState = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 rounded-xl shadow-lg mx-auto my-6 sm:my-8 md:my-12 max-w-md w-full
      ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}
  >
    <div className={`p-4 rounded-full mb-4 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
      <FaRobot className={`text-4xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
    </div>
    <h2 className="text-2xl font-bold mb-3">Welcome to AseekBot!</h2>
    <p className="text-center mb-6">I'm your AI assistant for data center procurement. How can I help you today?</p>
    <motion.div
      initial={{ scale: 1 }}
      animate={{
        scale: [1, 1.03, 1],
        transition: {
          repeat: Infinity,
          repeatType: "mirror",
          duration: 2,
          ease: "easeInOut"
        }
      }}
      className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800'}
        font-medium text-sm`}
    >
      Try asking me a question to get started
    </motion.div>
  </motion.div>
);

// Enhanced Progress Bar with animation
const EnhancedProgressBar = ({ progress, isDarkMode }: { progress: number; isDarkMode: boolean }) => {
  return (
    <div className="w-full max-w-[200px] sm:max-w-[250px] h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mt-2 shadow-inner">
      <motion.div
        className={`h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// Enhanced Async Status Indicator with better styling and animations
const EnhancedAsyncStatusIndicator = ({
  status,
  progress,
  isDarkMode,
  onRefresh,
  onCancel
}: {
  status: string,
  progress: number,
  isDarkMode: boolean,
  onRefresh: () => void,
  onCancel: () => void
}) => {
  // Log when the component renders with its props
  console.log('Rendering EnhancedAsyncStatusIndicator with:', { status, progress });
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col rounded-xl ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'} p-2 sm:p-3 shadow-md mt-2 w-full max-w-full`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center">
          <span className={`text-sm font-medium mr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Status: <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{status}</span>
          </span>
        </div>
        <div className="flex space-x-2 self-end sm:self-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            <FiRefreshCw className="mr-1.5" size={14} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className={`text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            <FiXCircle className="mr-1.5" size={14} />
            Cancel
          </motion.button>
        </div>
      </div>
      <div className="mt-2">
        <EnhancedProgressBar progress={progress} isDarkMode={isDarkMode} />
      </div>
    </motion.div>
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
  onCancelRequest?: () => void;
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
  onRefreshStatus = () => {
    console.log('Refresh status called');
  },
  onCancelRequest = () => {
    console.log('Cancel request called');
  }
}) => {
  // Scroll to bottom when messages change or when isThinking changes
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, messagesEndRef]);

  // Animation variants for message list
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Generate a random offset for each message (for subtle layout animation)
  const getRandomOffset = () => {
    return (Math.random() * 10 - 5); // Random number between -5 and 5
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="flex flex-col space-y-4 sm:space-y-6 px-1 sm:px-2 w-full"
    >
      {messages.length === 0 ? (
        <EmptyState isDarkMode={isDarkMode} />
      ) : (
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={`${message.timestamp}-${index}`}
              id={`message-${message.timestamp}`}
              initial={{ opacity: 0, y: 20, x: message.sender === 'user' ? 5 : -5 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1,
                delay: 0.05 * index
              }}
              className="message-container w-full max-w-full"
            >
              <Message
                message={message}
                isDarkMode={isDarkMode}
                onMultimediaClick={openMultimedia}
                onReact={(reaction) => handleReaction(index, reaction)}
                onPin={() => handlePinMessage(index)}
                onDownload={() => {/* No-op download handler */ }}
                showCitations={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex items-start space-x-2 sm:space-x-3 w-full max-w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <FaRobot className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>

          <div className="flex flex-col w-full max-w-full">
            <EnhancedTypingIndicator isDarkMode={isDarkMode} />

            {isAsyncProcessing && asyncStatus ? (
              <>
                {console.log('Async processing active:', { asyncStatus, asyncProgress })}
                <EnhancedAsyncStatusIndicator
                  status={asyncStatus}
                  progress={asyncProgress || progress}
                  isDarkMode={isDarkMode}
                  onRefresh={onRefreshStatus}
                  onCancel={onCancelRequest}
                />
              </>
            ) : (
              progress > 0 && <EnhancedProgressBar progress={progress} isDarkMode={isDarkMode} />
            )}
          </div>
        </motion.div>
      )}

      {/* This div is used to scroll to the bottom of the chat */}
      <div ref={messagesEndRef} />
    </motion.div>
  );
};

export default MessageList;
