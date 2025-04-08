'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import MarkdownRenderer from '../markdown/MarkdownRenderer';

interface MessageContentProps {
  content: string;
  isTyping: boolean;
  isDarkMode: boolean;
  styles: any;
  onImageClick: (imageUrl: string) => void;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isTyping,
  isDarkMode,
  styles,
  onImageClick
}) => {
  return (
    <>
      {isTyping ? (
        <div className={styles.content.typing.container}>
          <p className={styles.content.typing.text}>
            {content}
          </p>
          <motion.span
            animate={styles.content.typing.spinner.animation}
            transition={styles.content.typing.spinner.transition}
            className={styles.content.typing.spinner.wrapper}
          >
            <FaSpinner className={styles.content.typing.spinner.icon} />
          </motion.span>
        </div>
      ) : (
        <MarkdownRenderer 
          content={content}
          isDarkMode={isDarkMode}
          onImageClick={onImageClick}
        />
      )}
    </>
  );
};

export default MessageContent;
