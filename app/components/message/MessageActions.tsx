'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaThumbsUp, 
  FaThumbsDown, 
  FaThumbtack, 
  FaBook 
} from 'react-icons/fa';

interface MessageActionsProps {
  reaction: boolean | null;
  isPinned: boolean;
  showCitations: boolean;
  onReact: (reaction: boolean) => void;
  onPin: () => void;
  onToggleCitations: () => void;
  isDarkMode: boolean;
  styles: any;
  buttonVariants: any;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  reaction, 
  isPinned,
  showCitations,
  onReact,
  onPin,
  onToggleCitations,
  isDarkMode,
  styles,
  buttonVariants
}) => {
  return (
    <div className={styles.actions.container}>
      <motion.button
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={() => onReact(true)}
        className={styles.actions.reaction(isDarkMode, reaction, true)}
        aria-label="Thumbs up"
      >
        <FaThumbsUp size={16} />
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={() => onReact(false)}
        className={styles.actions.reaction(isDarkMode, reaction, false)}
        aria-label="Thumbs down"
      >
        <FaThumbsDown size={16} />
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={onPin}
        className={styles.actions.pin(isDarkMode, isPinned)}
        aria-label={isPinned ? "Unpin message" : "Pin message"}
      >
        <FaThumbtack size={16} />
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        onClick={onToggleCitations}
        className={styles.actions.citation(isDarkMode, showCitations)}
        aria-label={showCitations ? "Hide citations" : "Show citations"}
      >
        <FaBook size={16} />
      </motion.button>
    </div>
  );
};

export default MessageActions;
