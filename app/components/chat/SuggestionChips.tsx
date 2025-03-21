"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <motion.div
      className="flex flex-wrap gap-3 mb-4"
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
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300
            whitespace-nowrap ${selectedChip === suggestion
              ? darkMode
                ? 'border-2 border-blue-400 bg-blue-800 shadow-lg shadow-blue-900/30'
                : 'border-2 border-blue-500 bg-blue-100 shadow-md shadow-blue-500/20'
              : hoveredChip === suggestion
                ? darkMode
                  ? 'border-2 border-blue-400/50 bg-blue-800/80 shadow-md shadow-blue-900/20'
                  : 'border-2 border-blue-500/50 bg-blue-100/80 shadow-sm shadow-blue-500/10'
                : 'border-2 border-transparent'
            } ${darkMode
              ? 'bg-blue-900 hover:bg-blue-800 text-blue-100 shadow-md'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-800 shadow-sm'
            }`}
          whileHover={{
            scale: 1.05,
            boxShadow: darkMode
              ? '0 10px 15px -3px rgba(30, 64, 175, 0.3), 0 4px 6px -4px rgba(30, 64, 175, 0.3)'
              : '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -4px rgba(59, 130, 246, 0.2)'
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