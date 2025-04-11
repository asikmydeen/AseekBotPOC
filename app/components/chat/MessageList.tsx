// Enhanced MessageList.tsx
"use client";
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { FaRobot, FaUser } from 'react-icons/fa';
import Message from '../message/Message';
import { MessageType, MultimediaData } from '../../types/shared';
import { EnhancedTypingIndicator, messageAnimations } from './EnhancedUIComponents';
import { ProcessingStatus, getStatusMessage } from '../../types/status';
import { MultimediaType, ReactionType } from '../../constants';
import { getMessageListStyles } from '../../styles/chatStyles';

// Enhanced Empty State Component
const EmptyState = ({ isDarkMode }: { isDarkMode: boolean }) => {
  // Get centralized styles
  const styles = getMessageListStyles(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.emptyState.container}
    >
      <div className={styles.emptyState.iconContainer}>
        <FaRobot className={styles.emptyState.icon} />
      </div>
      <h2 className={styles.emptyState.title}>Welcome to AseekBot!</h2>
      <p className={styles.emptyState.description}>I'm your AI assistant for data center procurement. How can I help you today?</p>
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
        className={styles.emptyState.promptBox}
      >
        Try asking me a question to get started
      </motion.div>
    </motion.div>
  );
};

// Enhanced Progress Bar with animation
const EnhancedProgressBar = ({ progress, isDarkMode }: { progress: number; isDarkMode: boolean }) => {
  // Get centralized styles
  const styles = getMessageListStyles(isDarkMode);

  return (
    <div className={styles.progressBar.container}>
      <motion.div
        className={styles.progressBar.fill}
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
  status: ProcessingStatus | string,
  progress: number,
  isDarkMode: boolean,
  onRefresh: () => void,
  onCancel: () => void
}) => {
  // Get centralized styles
  const styles = getMessageListStyles(isDarkMode);

  // Log when the component renders with its props
  console.log('Rendering EnhancedAsyncStatusIndicator with:', { status, progress });

  // Get a human-readable status message if it's a ProcessingStatus enum value
  const displayStatus = typeof status === 'string' && Object.values(ProcessingStatus).includes(status as ProcessingStatus)
    ? getStatusMessage(status as ProcessingStatus)
    : status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.statusIndicator.container}
    >
      <div className={styles.statusIndicator.statusWrapper}>
        <div className="flex items-center">
          <span className={styles.statusIndicator.statusLabel}>
            Status: <span className={styles.statusIndicator.statusValue}>{displayStatus}</span>
          </span>
        </div>
        <div className={styles.statusIndicator.buttonsContainer}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className={styles.statusIndicator.refreshButton}
          >
            <FiRefreshCw className="mr-1.5" size={14} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className={styles.statusIndicator.cancelButton}
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
  openMultimedia: (multimedia: { type: MultimediaType; data: MultimediaData }) => void;
  handleReaction: (index: number, reaction: ReactionType) => void;
  handlePinMessage: (index: number) => void;
  messagesEndRef?: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  // New async props
  isAsyncProcessing?: boolean;
  asyncProgress?: number;
  asyncStatus?: ProcessingStatus | string;
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

  // Get centralized styles
  const styles = getMessageListStyles(isDarkMode);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className={styles.container}
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
              className={styles.messageItem}
            >
              <Message
                message={message}
                isDarkMode={isDarkMode}
                onMultimediaClick={(multimedia) => openMultimedia({ type: MultimediaType.VIDEO, data: multimedia })}
                onReact={(_, reaction) => handleReaction(index, reaction ? ReactionType.THUMBS_UP : ReactionType.THUMBS_DOWN)}
                onPin={(messageId, isPinned) => handlePinMessage(index)}
                showCitations={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Show typing indicator or async status indicator */}
      {(isThinking || isAsyncProcessing) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={styles.typingContainer}
        >
          <div className={styles.botIconContainer}>
            <FaRobot className={styles.botIcon} />
          </div>

          <div className="flex flex-col w-full max-w-full">
            {isThinking && <EnhancedTypingIndicator isDarkMode={isDarkMode} />}

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
              isThinking && progress > 0 && <EnhancedProgressBar progress={progress} isDarkMode={isDarkMode} />
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
