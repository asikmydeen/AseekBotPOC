"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuggestionChipsProps {
  suggestions?: string[];
  onChipClick: (suggestion: string) => void;
  darkMode: boolean;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ suggestions, onChipClick, darkMode }) => {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);

  if (!suggestions || suggestions.length === 0) return null;

  const handleChipClick = (suggestion: string) => {
    setSelectedChip(suggestion);
    onChipClick(suggestion);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-wrap gap-3 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={`${suggestion}-${index}`}
            onClick={() => handleChipClick(suggestion)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md border-2 ${selectedChip === suggestion
                ? darkMode
                  ? 'border-blue-400 bg-blue-800'
                  : 'border-blue-500 bg-blue-200'
                : 'border-transparent'
              } ${darkMode ? 'bg-blue-900 hover:bg-blue-800 text-blue-100' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {suggestion}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default SuggestionChips;
