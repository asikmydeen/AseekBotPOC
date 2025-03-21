// Enhanced ChatFooter.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import { TicketStep, TicketDetails, FeedbackData } from '../../types/shared';
import SuggestionChips from './SuggestionChips';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import { EnhancedChatInput, EnhancedFileDropzone } from './EnhancedUIComponents';

interface ChatFooterProps {
  isDarkMode: boolean;
  showDocumentAnalysisPrompt?: boolean;
  clearDocumentAnalysisPrompt?: () => void;
  setShowFileDropzone: (show: boolean) => void;
  toggleFileDropzone: () => void;
  clearUploadedFiles: () => void;
  showTicketForm: boolean;
  ticketDetails: TicketDetails;
  ticketStep: TicketStep;
  setTicketStep: React.Dispatch<React.SetStateAction<TicketStep>>;
  setTicketDetails: React.Dispatch<any>;
  createTicket: () => Promise<any>;
  closeTicketForm: () => void;
  showFeedbackForm: boolean;
  feedback: FeedbackData;
  setFeedback: React.Dispatch<any>;
  submitFeedback: () => Promise<boolean>;
  closeFeedbackForm: () => void;
  messages: any[];
  handleCustomSuggestionClick: (suggestion: string) => void;
  showFileDropzone: boolean;
  uploadedFiles: any[];
  getRootProps: any;
  getInputProps: any;
  isUploading: boolean;
  isDragActive: boolean;
  progress: number;
  removeFile: (index: number) => void;
  handleFileAction: (action: string) => void;
  handleInputSubmit: (text: string) => void;
  isThinking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange?: (text: string) => void;
  pendingInput?: string;
  isAsyncProcessing?: boolean;
  asyncProgress?: number;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  isDarkMode,
  showDocumentAnalysisPrompt,
  clearDocumentAnalysisPrompt,
  setShowFileDropzone,
  toggleFileDropzone,
  clearUploadedFiles,
  showTicketForm,
  ticketDetails,
  ticketStep,
  setTicketStep,
  setTicketDetails,
  createTicket,
  closeTicketForm,
  showFeedbackForm,
  feedback,
  setFeedback,
  submitFeedback,
  closeFeedbackForm,
  messages,
  handleCustomSuggestionClick,
  showFileDropzone,
  uploadedFiles,
  getRootProps,
  getInputProps,
  isUploading,
  isDragActive,
  progress,
  removeFile,
  handleFileAction,
  handleInputSubmit,
  isThinking,
  inputRef,
  handleInputChange,
  pendingInput,
  isAsyncProcessing = false,
  asyncProgress = 0
}) => {
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Extract suggestions from last bot message
  const lastBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot');
  const suggestions = lastBotMessage?.suggestions || [];

  // Render the async processing status info
  const renderAsyncProcessingInfo = () => {
    if (!isAsyncProcessing) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center justify-center py-2 px-4 rounded-lg text-sm ${isDarkMode ? 'dark-info-bg dark-info-text' : 'bg-blue-50 text-blue-700'
          } mb-3 shadow-md`}
      >
        <FiClock className="mr-2" />
        <span>Processing request: {Math.round(asyncProgress)}%</span>
        <div className="ml-3 flex items-center">
          <FiRefreshCw className="animate-spin mr-1" />
        </div>
      </motion.div>
    );
  };

  // Render different footer components based on context
  const renderFooterContent = () => {
    // When showing ticket form
    if (showTicketForm) {
      return (
        <TicketForm
          ticketDetails={ticketDetails}
          ticketStep={ticketStep}
          setTicketStep={setTicketStep}
          setTicketDetails={setTicketDetails}
          createTicket={createTicket}
          closeTicketForm={closeTicketForm}
          isDarkMode={isDarkMode}
        />
      );
    }

    // When showing feedback form
    if (showFeedbackForm) {
      return (
        <FeedbackForm
          feedback={feedback}
          setFeedback={setFeedback}
          submitFeedback={submitFeedback}
          closeFeedbackForm={closeFeedbackForm}
          isDarkMode={isDarkMode}
        />
      );
    }

    // When showing file upload section
    if (showFileDropzone) {
      return (
        <EnhancedFileDropzone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          isDarkMode={isDarkMode}
          uploadedFiles={uploadedFiles}
          removeFile={removeFile}
          isUploading={isUploading}
          progress={progress}
          handleFileAction={handleFileAction}
        />
      );
    }

    // Default: show suggestions if available
    return (
      <>
        {suggestions.length > 0 && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="mb-3"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'dark-text' : 'text-gray-600'}`}>
                Suggested replies
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuggestions(false)}
                className={`text-xs px-2 py-1 rounded-md ${isDarkMode ? 'dark-text-secondary hover:dark-text hover:dark-bg-hover' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                Hide
              </motion.button>
            </div>
            <SuggestionChips
              suggestions={suggestions}
              onChipClick={handleCustomSuggestionClick}
              darkMode={isDarkMode}
            />
          </motion.div>
        )}
      </>
    );
  };

  return (
    <div className={`px-4 pt-2 pb-4 border-t ${isDarkMode ? 'dark-border dark-bg' : 'border-gray-200 bg-white'}`}>
      {/* Async processing status indicator */}
      {isThinking && isAsyncProcessing && renderAsyncProcessingInfo()}

      {/* Main content based on state */}
      <AnimatePresence mode="wait">
        {renderFooterContent()}
      </AnimatePresence>

      {/* Enhanced Chat Input */}
      <EnhancedChatInput
        onSubmit={handleInputSubmit}
        isThinking={isThinking}
        isDarkMode={isDarkMode}
        onFileUploadClick={toggleFileDropzone}
        showFileDropzone={showFileDropzone}
        onInputChange={handleInputChange}
        initialValue={pendingInput || ''}
        inputRef={inputRef}
        hasUploadedFiles={uploadedFiles.length > 0}
      />
    </div>
  );
};

export default ChatFooter;
