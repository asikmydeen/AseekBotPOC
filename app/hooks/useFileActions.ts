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
        // Check if we have a stored prompt
        let analysisText = pendingInput || 'Please analyze these documents';
        let storedPrompt = null;
        let promptVariables: Record<string, string> = {};

        try {
          // Get the prompt from localStorage
          const promptJson = localStorage.getItem('currentPrompt');
          if (promptJson) {
            storedPrompt = JSON.parse(promptJson);

            // Get variables if they exist
            const variablesJson = localStorage.getItem('promptVariables');
            if (variablesJson) {
              promptVariables = JSON.parse(variablesJson);
              console.log('Using variables for analysis:', promptVariables);
            }

            if (storedPrompt && storedPrompt.content) {
              // Process the prompt content with variables
              let processedContent = storedPrompt.content;

              // Replace variables in the content
              Object.entries(promptVariables).forEach(([key, value]) => {
                const regex = new RegExp(`\$\{${key}\}`, 'g');
                processedContent = processedContent.replace(regex, value);
              });

              // Use the processed content as the message
              analysisText = `Please analyze these documents using the "${storedPrompt.title}" prompt with the following instructions: ${processedContent}`;
              console.log('Using stored prompt for analysis:', storedPrompt.title);
            }
          }
        } catch (error) {
          console.error('Error parsing stored prompt or variables:', error);
        }

        // Send message with files for analysis
        sendMessage(analysisText, uploadedFiles);

        // Clear pending input after sending
        setPendingInput('');

        // Clear document analysis prompt if it's active
        if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
          clearDocumentAnalysisPrompt();
        }

        // Clear the stored prompt and variables
        localStorage.removeItem('currentPrompt');
        localStorage.removeItem('promptVariables');

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