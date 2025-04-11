"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestionChipStyles } from '../../styles/chatStyles';

interface SuggestionChipsProps {
  suggestions?: string[];
  onChipClick: (suggestion: string) => void;
  darkMode: boolean;
}

const EnhancedSuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onChipClick, darkMode }) => {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [hoveredChip, setHoveredChip] = useState<string | null>(null);

  if (!suggestions || suggestions.length === 0) return null;

  const handleChipClick = (suggestion: string) => {
    setSelectedChip(suggestion);
    onChipClick(suggestion);
  };

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for individual chips
  const chipVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  // Get centralized styles
  const styles = getSuggestionChipStyles();

  return (
    <motion.div
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {suggestions.map((suggestion, index) => (
        <motion.button
          key={`${suggestion}-${index}`}
          variants={chipVariants}
          onClick={() => handleChipClick(suggestion)}
          onMouseEnter={() => setHoveredChip(suggestion)}
          onMouseLeave={() => setHoveredChip(null)}
          className={styles.chip(selectedChip === suggestion, hoveredChip === suggestion, darkMode)}
          whileHover={{
            scale: 1.05,
            boxShadow: darkMode
              ? 'var(--shadow-dark-hover)'
              : 'var(--shadow-light-hover)'
          }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            initial={{ opacity: 1 }}
            animate={{
              scale: selectedChip === suggestion ? [1, 1.05, 1] : 1,
              transition: {
                repeat: selectedChip === suggestion ? Infinity : 0,
                repeatType: "reverse",
                duration: 1.5
              }
            }}
          >
            {suggestion}
          </motion.span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default EnhancedSuggestionChips;