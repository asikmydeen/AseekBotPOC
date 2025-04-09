// app/components/chat/DocumentAnalysisPrompt.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaFileUpload } from 'react-icons/fa';

interface DocumentAnalysisPromptProps {
  isDarkMode: boolean;
  onClose?: () => void;
  setShowFileDropzone: (show: boolean) => void;
  clearUploadedFiles: () => void;
}

const DocumentAnalysisPrompt: React.FC<DocumentAnalysisPromptProps> = ({
  isDarkMode,
  onClose,
  setShowFileDropzone,
  clearUploadedFiles
}) => {
  const [promptTitle, setPromptTitle] = useState<string>('Document Analysis');

  // Get the current prompt from localStorage if available
  useEffect(() => {
    try {
      const storedPrompt = localStorage.getItem('currentPrompt');
      if (storedPrompt) {
        const prompt = JSON.parse(storedPrompt);
        if (prompt && prompt.title) {
          setPromptTitle(prompt.title);
        }
      }
    } catch (error) {
      console.error('Error parsing stored prompt:', error);
    }
  }, []);
  /**
   * Handles the dismissal of the document analysis prompt
   * - Clears the document analysis prompt if the function is provided
   * - Hides the file dropzone
   * - Clears any uploaded files
   */
  const handleDismiss = () => {
    if (onClose) {
      onClose();
    }
    setShowFileDropzone(false);
    clearUploadedFiles();
  };

  /**
   * Handles the upload action
   * - Shows the file dropzone for file selection
   */
  const handleUpload = () => {
    setShowFileDropzone(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`mb-4 p-4 rounded-lg ${
        isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
      } shadow-md`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-blue-800'}`}>
            {promptTitle}
          </h3>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Please select files to use with this prompt. I'll analyze them according to the prompt instructions.
          </p>

          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleUpload}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              } transition-colors duration-200`}
            >
              <FaFileUpload className="mr-1.5" />
              Upload Files
            </button>

            <button
              onClick={handleDismiss}
              className={`px-3 py-1.5 text-sm rounded-md ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-700 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              } transition-colors duration-200`}
            >
              Not Now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={`p-1 rounded-full ${
            isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
          } transition-colors duration-200`}
          aria-label="Close"
        >
          <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-500'} />
        </button>
      </div>
    </motion.div>
  );
};

export default DocumentAnalysisPrompt;
