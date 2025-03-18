// app/components/chat/ChatFooter.tsx
"use client";
import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import SuggestionChips from './SuggestionChips';
import FileUploadSection from './FileUploadSection';
import DocumentAnalysisPrompt from './DocumentAnalysisPrompt';
import ChatInput from './ChatInput';
import { MessageType } from './ChatInterface';

interface ChatFooterProps {
  isDarkMode: boolean;
  showDocumentAnalysisPrompt?: boolean;
  clearDocumentAnalysisPrompt?: () => void;
  setShowFileDropzone: (show: boolean) => void;
  clearUploadedFiles: () => void;
  showTicketForm: boolean;
  ticketDetails: {
    title: string;
    description: string;
    priority: string;
    category: string;
    email: string;
  };
  ticketStep: number;
  setTicketStep: (step: number) => void;
  setTicketDetails: (details: any) => void;
  createTicket: () => void;
  closeTicketForm: () => void;
  showFeedbackForm: boolean;
  feedback: {
    rating: number;
    comment: string;
  };
  setFeedback: (feedback: any) => void;
  submitFeedback: () => void;
  closeFeedbackForm: () => void;
  messages: MessageType[];
  handleCustomSuggestionClick: (suggestion: string) => void;
  showFileDropzone: boolean;
  uploadedFiles: Array<{
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  getRootProps: any;
  getInputProps: any;
  isUploading: boolean;
  isDragActive: boolean;
  progress: number;
  removeFile: (index: number) => void;
  handleFileAction: (action: string) => void;
  handleInputSubmit: (input: string) => void;
  isThinking: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  handleInputChange: (text: string) => void;
  pendingInput: string;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  isDarkMode,
  showDocumentAnalysisPrompt,
  clearDocumentAnalysisPrompt,
  setShowFileDropzone,
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
  pendingInput
}) => {
  // Get the latest message to extract suggestions
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const suggestions = latestMessage?.sender === 'bot' ? latestMessage.suggestions || [] : [];

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Document Analysis Prompt */}
      {showDocumentAnalysisPrompt && (
        <DocumentAnalysisPrompt
          onClose={clearDocumentAnalysisPrompt}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Ticket Form */}
      <AnimatePresence>
        {showTicketForm && (
          <TicketForm
            isDarkMode={isDarkMode}
            ticketDetails={ticketDetails}
            step={ticketStep}
            setStep={setTicketStep}
            setTicketDetails={setTicketDetails}
            createTicket={createTicket}
            closeTicketForm={closeTicketForm}
          />
        )}
      </AnimatePresence>

      {/* Feedback Form */}
      <AnimatePresence>
        {showFeedbackForm && (
          <FeedbackForm
            isDarkMode={isDarkMode}
            feedback={feedback}
            setFeedback={setFeedback}
            submitFeedback={submitFeedback}
            closeFeedbackForm={closeFeedbackForm}
          />
        )}
      </AnimatePresence>

      {/* Suggestion Chips */}
      {suggestions.length > 0 && !showTicketForm && !showFeedbackForm && (
        <SuggestionChips
          suggestions={suggestions}
          onSuggestionClick={handleCustomSuggestionClick}
          isDarkMode={isDarkMode}
        />
      )}

      {/* File Upload Section */}
      {showFileDropzone && (
        <FileUploadSection
          showFileDropzone={showFileDropzone}
          isDarkMode={isDarkMode}
          uploadedFiles={uploadedFiles}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isUploading={isUploading}
          isDragActive={isDragActive}
          progress={progress}
          removeFile={removeFile}
          handleFileAction={handleFileAction}
        />
      )}

      {/* Chat Input */}
      {!showTicketForm && !showFeedbackForm && (
        <ChatInput
          onSubmit={handleInputSubmit}
          isThinking={isThinking}
          isDarkMode={isDarkMode}
          inputRef={inputRef}
          onInputChange={handleInputChange}
          initialValue={pendingInput}
          onFileUploadClick={() => setShowFileDropzone(prev => !prev)}
          hasUploadedFiles={uploadedFiles.length > 0}
          clearFiles={clearUploadedFiles}
        />
      )}
    </div>
  );
};

export default ChatFooter;
