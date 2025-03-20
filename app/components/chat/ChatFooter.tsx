"use client";
import React, { useState, useEffect } from 'react';
import { FiPaperclip, FiSend, FiClock, FiRefreshCw } from 'react-icons/fi';
import { TicketStep, TicketDetails, FeedbackData } from '../../types/shared';
import SuggestionChips from './SuggestionChips';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import FileUploadSection from './FileUploadSection';
import TextareaAutosize from 'react-textarea-autosize';

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
  // New async props
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
  // New async props
  isAsyncProcessing = false,
  asyncProgress = 0
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Extract suggestions from last bot message
  const lastBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot');
  const suggestions = lastBotMessage?.suggestions || [];

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  // Update input value when pendingInput changes (for file uploads)
  useEffect(() => {
    if (pendingInput !== undefined) {
      setInputValue(pendingInput);
    }
  }, [pendingInput]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputValue.trim() || uploadedFiles.length > 0) {
      handleInputSubmit(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChangeInternal = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputValue(text);
    if (handleInputChange) {
      handleInputChange(text);
    }
  };

  // To make the file dropzone work
  const handleAttachClick = () => {
    toggleFileDropzone();
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
        <div className="mb-4">
          <FileUploadSection
            uploadedFiles={uploadedFiles}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isUploading={isUploading}
            isDragActive={isDragActive}
            progress={progress}
            removeFile={removeFile}
            cancelUpload={() => handleFileAction('cancel')}
            analyzeFiles={() => handleFileAction('analyze')}
            sendFiles={() => handleFileAction('send')}
            isDarkMode={isDarkMode}
            showPrompt={!!showDocumentAnalysisPrompt}
            promptMessage={
              showDocumentAnalysisPrompt
                ? "How would you like me to help with these documents?"
                : ""
            }
          />
        </div>
      );
    }

    // Default: input and suggestions
    return (
      <>
        {suggestions.length > 0 && showSuggestions && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Suggested replies
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className={`text-xs ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Hide
              </button>
            </div>
            <SuggestionChips
              suggestions={suggestions}
              onChipClick={handleCustomSuggestionClick}
              darkMode={isDarkMode}
            />
          </div>
        )}
      </>
    );
  };

  // Render the async processing status info
  const renderAsyncProcessingInfo = () => {
    if (!isAsyncProcessing) return null;

    return (
      <div
        className={`flex items-center justify-center py-1 px-2 rounded-md text-xs ${isDarkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-700'
          } mb-2`}
      >
        <FiClock className="mr-1" />
        <span>Processing request: {Math.round(asyncProgress)}%</span>
        <FiRefreshCw className="ml-2 animate-spin" />
      </div>
    );
  };

  return (
    <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      {renderFooterContent()}

      {/* Async processing status indicator */}
      {isThinking && isAsyncProcessing && renderAsyncProcessingInfo()}

      <form onSubmit={handleSubmit} className="flex items-end">
        <div className="relative flex-1 mr-2">
          <TextareaAutosize
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChangeInternal}
            onKeyDown={handleKeyDown}
            placeholder={isThinking ? "Aseekbot is processing..." : "Type a message..."}
            disabled={isThinking}
            className={`w-full p-3 rounded-lg focus:outline-none focus:ring-2 resize-none max-h-32 overflow-y-auto ${isDarkMode
                ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-blue-500 border-gray-600'
                : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-blue-400 border-gray-300'
              } ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
            minRows={1}
            maxRows={5}
          />

          <button
            type="button"
            onClick={handleAttachClick}
            className={`absolute right-3 bottom-3 p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              } ${isThinking ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isThinking}
          >
            <FiPaperclip size={18} />
          </button>
        </div>

        <button
          type="submit"
          disabled={isThinking || (!inputValue.trim() && uploadedFiles.length === 0)}
          className={`p-3 rounded-lg ${isThinking || (!inputValue.trim() && uploadedFiles.length === 0)
              ? isDarkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition-colors duration-200`}
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatFooter;
