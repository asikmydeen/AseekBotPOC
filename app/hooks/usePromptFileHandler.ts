import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { UploadedFile, Prompt } from '../types/shared';

interface UsePromptFileHandlerProps {
  onStatusUpdate?: (status: string, progress: number) => void;
  sessionId: string;
  chatId: string;
  userId: string;
}

/**
 * Custom hook for handling prompt file selection and submission
 */
const usePromptFileHandler = ({
  onStatusUpdate,
  sessionId,
  chatId,
  userId
}: UsePromptFileHandlerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [requiredFileCount, setRequiredFileCount] = useState<number>(0);
  const [requiredVariables, setRequiredVariables] = useState<string[]>([]);

  // Parse prompt content to extract required files and variables
  const parsePromptRequirements = useCallback((prompt: Prompt) => {
    if (!prompt || !prompt.content) return;

    // Simple regex to find file requirements - this could be more sophisticated
    const fileMatch = prompt.content.match(/(\d+)\s+files?/i);
    if (fileMatch && fileMatch[1]) {
      setRequiredFileCount(parseInt(fileMatch[1], 10));
    }

    // Find variables in the format ${VARIABLE_NAME}
    const variableMatches = prompt.content.match(/\${([A-Z_]+)}/g);
    if (variableMatches) {
      const uniqueVariables = [...new Set(
        variableMatches.map(match => match.replace(/\${(.*)}/, '$1'))
      )];
      setRequiredVariables(uniqueVariables);
    } else {
      setRequiredVariables([]);
    }
  }, []);

  // Open dialog with the selected prompt
  const openFileDialog = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    parsePromptRequirements(prompt);
    setIsDialogOpen(true);
    setError(null);
  }, [parsePromptRequirements]);

  // Close dialog and reset state
  const closeFileDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedFiles([]);
    setVariables({});
    setError(null);
  }, []);

  // Handle file selection
  const handleFileSelection = useCallback((files: UploadedFile[], inputVariables: Record<string, string>) => {
    setSelectedFiles(files);
    setVariables(inputVariables);
    
    if (selectedPrompt) {
      handleSubmitPrompt(selectedPrompt, files, inputVariables);
    }
  }, [selectedPrompt]);

  // Submit prompt with files and variables
  const handleSubmitPrompt = useCallback(async (
    prompt: Prompt, 
    files: UploadedFile[], 
    promptVariables: Record<string, string>
  ) => {
    if (!prompt) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Replace variables in prompt content
      let processedContent = prompt.content;
      Object.entries(promptVariables).forEach(([key, value]) => {
        processedContent = processedContent.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      });
      
      // Format files for API
      const s3Files = files.map(file => ({
        name: file.name,
        fileName: file.fileName || file.name,
        s3Url: file.s3Url || file.url,
        mimeType: file.type
      }));
      
      // Call API to send message with prompt and files
      const response = await apiService.sendMessage({
        promptId: prompt.promptId,
        userId,
        sessionId,
        chatId,
        s3Files
      });
      
      if (response && response.requestId) {
        setRequestId(response.requestId);
        setIsPolling(true);
        
        if (onStatusUpdate) {
          onStatusUpdate('PROCESSING', 10);
        }
      }
      
      closeFileDialog();
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError(err instanceof Error ? err : new Error('Failed to submit prompt'));
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, sessionId, chatId, closeFileDialog, onStatusUpdate]);

  // Poll for status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isPolling && requestId) {
      intervalId = setInterval(async () => {
        try {
          const statusResponse = await apiService.checkStatus(requestId);
          
          if (statusResponse) {
            if (onStatusUpdate) {
              onStatusUpdate(statusResponse.status, statusResponse.progress || 0);
            }
            
            // Stop polling when complete or error
            if (
              statusResponse.status === 'COMPLETED' || 
              statusResponse.status === 'FAILED' ||
              statusResponse.status === 'ERROR'
            ) {
              setIsPolling(false);
              setRequestId(null);
            }
          }
        } catch (err) {
          console.error('Error polling status:', err);
          setIsPolling(false);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, requestId, onStatusUpdate]);

  return {
    isDialogOpen,
    selectedPrompt,
    selectedFiles,
    variables,
    isSubmitting,
    error,
    requiredFileCount,
    requiredVariables,
    openFileDialog,
    closeFileDialog,
    handleFileSelection
  };
};

export default usePromptFileHandler;
