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
import EnhancedPromptFileDropzone from './EnhancedPromptFileDropzone';

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


  // Render different footer components based on context
  const renderFooterContent = () => {
    // When showing ticket form
    if (showTicketForm) {
      return (
        <div className="w-full max-w-full overflow-x-hidden">
          <TicketForm
            ticketDetails={ticketDetails}
            ticketStep={ticketStep}
            setTicketStep={setTicketStep}
            setTicketDetails={setTicketDetails}
            createTicket={createTicket}
            closeTicketForm={closeTicketForm}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }

    // When showing feedback form
    if (showFeedbackForm) {
      return (
        <div className="w-full max-w-full overflow-x-hidden">
          <FeedbackForm
            feedback={feedback}
            setFeedback={setFeedback}
            submitFeedback={submitFeedback}
            closeFeedbackForm={closeFeedbackForm}
            isDarkMode={isDarkMode}
          />
        </div>
      );
    }

    // When showing file upload section
    if (showFileDropzone) {
      // Check if we have a stored prompt
      const hasStoredPrompt = localStorage.getItem('currentPrompt') !== null;

      return (
        <div className="w-full max-w-full overflow-x-hidden">
          {hasStoredPrompt ? (
            <EnhancedPromptFileDropzone
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
          ) : (
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
          )}
        </div>
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
            className="mb-2 sm:mb-3"
          >
            <div className="flex flex-wrap justify-between items-center mb-1 sm:mb-2">
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'dark-text' : 'text-gray-600'}`}>
                Suggested replies
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuggestions(false)}
                className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${isDarkMode ? 'dark-text-secondary hover:dark-text hover:dark-bg-hover' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
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
    <div className={`px-2 sm:px-4 pt-2 pb-3 sm:pb-4 border-t ${isDarkMode ? 'dark-border dark-bg' : 'border-gray-200 bg-white'}`}>
      {/* Main content based on state */}
      <AnimatePresence mode="wait">
        {renderFooterContent()}
      </AnimatePresence>

      {/* Enhanced Chat Input */}
      <div className="w-full">
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
    </div>
  );
};

export default ChatFooter;
