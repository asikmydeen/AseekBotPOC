// app/hooks/useFileActions.ts
import { useCallback, RefObject } from 'react';
import { UploadedFile } from '../types/shared';

interface UseFileActionsProps {
  inputRef: React.RefObject<HTMLTextAreaElement | null> | React.MutableRefObject<HTMLTextAreaElement | null>;
  pendingInput: string;
  uploadedFiles: UploadedFile[];
  clearUploadedFiles: () => void;
  setShowFileDropzone: (show: boolean) => void;
  showDocumentAnalysisPrompt?: boolean;
  clearDocumentAnalysisPrompt?: () => void;
  setPendingInput: (input: string) => void;
  sendMessage: (text: string, files?: any[]) => void;
}

/**
 * Custom hook for handling file-related actions in the chat interface
 * Provides a unified handler for file actions like canceling uploads,
 * analyzing documents, and sending messages with files
 */
const useFileActions = ({
  inputRef,
  pendingInput,
  uploadedFiles,
  clearUploadedFiles,
  setShowFileDropzone,
  showDocumentAnalysisPrompt,
  clearDocumentAnalysisPrompt,
  setPendingInput,
  sendMessage
}: UseFileActionsProps) => {

  /**
   * Handles file-related actions in the chat interface
   * @param action - The action to perform ('cancel', 'analyze', 'send')
   */
  const handleFileAction = useCallback((action: string) => {
    switch (action) {
      case 'cancel':
        // Clear uploaded files and hide dropzone
        clearUploadedFiles();
        setShowFileDropzone(false);

        // Clear document analysis prompt if it's active
        if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
          clearDocumentAnalysisPrompt();
        }

        // Restore any pending input that was typed before file upload
        if (inputRef.current && pendingInput) {
          inputRef.current.value = pendingInput;
          inputRef.current.focus();
        }
        break;

      case 'analyze':
        // Send message with files for analysis
        const analysisText = pendingInput || 'Please analyze these documents';
        sendMessage(analysisText, uploadedFiles);

        // Clear pending input after sending
        setPendingInput('');

        // Clear document analysis prompt if it's active
        if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
          clearDocumentAnalysisPrompt();
        }

        // Clear uploaded files and hide dropzone after a short delay
        setTimeout(() => {
          clearUploadedFiles();
          setShowFileDropzone(false);
        }, 500);
        break;

      case 'send':
        // Send message with files
        const messageText = pendingInput || 'I am sending you these files';
        sendMessage(messageText, uploadedFiles);

        // Clear pending input after sending
        setPendingInput('');

        // Clear uploaded files and hide dropzone after a short delay
        setTimeout(() => {
          clearUploadedFiles();
          setShowFileDropzone(false);
        }, 500);
        break;

      default:
        console.error('Unknown file action:', action);
    }
  }, [
    inputRef,
    pendingInput,
    uploadedFiles,
    clearUploadedFiles,
    setShowFileDropzone,
    showDocumentAnalysisPrompt,
    clearDocumentAnalysisPrompt,
    setPendingInput,
    sendMessage
  ]);

  return { handleFileAction };
};

export default useFileActions;