// app/components/chat/DocumentAnalysisPrompt.tsx
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaFileUpload } from 'react-icons/fa';
import { getDocumentAnalysisPromptStyles } from '../../styles/chatStyles';

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

  // Get centralized styles
  const styles = getDocumentAnalysisPromptStyles(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={styles.container}
    >
      <div className={styles.contentWrapper}>
        <div className="flex-1">
          <h3 className={styles.title}>
            Document Analysis
          </h3>
          <p className={styles.description}>
            Upload documents for analysis. I can extract information, summarize content, and answer questions about your documents.
          </p>

          <div className={styles.buttonsContainer}>
            <button
              onClick={handleUpload}
              className={styles.analyzeButton}
            >
              <FaFileUpload className="mr-1.5" />
              Upload Files
            </button>

            <button
              onClick={handleDismiss}
              className={styles.analyzeButton}
            >
              Not Now
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={styles.closeButton}
          aria-label="Close"
        >
          <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-500'} />
        </button>
      </div>
    </motion.div>
  );
};

export default DocumentAnalysisPrompt;
