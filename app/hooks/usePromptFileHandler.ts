import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { UploadedFile, Prompt } from '../types/shared';
import { useModal } from '../contexts/ModalContext';

interface UsePromptFileHandlerProps {
  onStatusUpdate?: (status: string, progress: number, userMessage?: string) => void;
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
  // Dialog state is now managed by the modal context
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

    console.log('Parsing prompt requirements for:', prompt.title);

    // Check for file requirements
    let fileCount = 0;

    // Check if prompt ID suggests file requirements
    if (
      prompt.promptId.includes('analysis') ||
      prompt.promptId.includes('comparison') ||
      prompt.promptId.includes('vendor') ||
      prompt.promptId.includes('document')
    ) {
      fileCount = 2; // Default to at least 2 files for analysis prompts
    }

    // Look for explicit file mentions
    const fileMatch = prompt.content.match(/(\d+)\s+files?/i);
    if (fileMatch && fileMatch[1]) {
      fileCount = Math.max(fileCount, parseInt(fileMatch[1], 10));
    }

    // Count document references like ${doc_1}, ${sow_doc}, etc.
    const docMatches = prompt.content.match(/\${([a-zA-Z0-9_]+_doc[a-zA-Z0-9_]*|[a-zA-Z0-9_]*doc_[a-zA-Z0-9_]+)}/g);
    if (docMatches) {
      fileCount = Math.max(fileCount, docMatches.length);
    }

    console.log('Detected required file count:', fileCount);
    setRequiredFileCount(fileCount);

    // Find variables in the format ${VARIABLE_NAME}
    const variableMatches = prompt.content.match(/\${([A-Za-z0-9_]+)}/g);
    if (variableMatches) {
      const uniqueVariables = [...new Set(
        variableMatches.map(match => match.replace(/\${(.*)}/, '$1'))
      )];
      console.log('Detected variables:', uniqueVariables);
      setRequiredVariables(uniqueVariables);
    } else {
      setRequiredVariables([]);
    }
  }, []);

  // Get the modal context
  const { openFileSelectionDialog } = useModal();

  // Open dialog with the selected prompt
  const openFileDialog = useCallback((prompt: Prompt) => {
    console.log('Opening file dialog for prompt:', prompt.title);

    // Set the selected prompt locally
    setSelectedPrompt(prompt);
    setError(null);

    // Parse prompt requirements
    parsePromptRequirements(prompt);

    // Use the global modal context to open the dialog
    setTimeout(() => {
      openFileSelectionDialog(
        prompt,
        requiredFileCount,
        requiredVariables,
        handleFileSelection
      );
      console.log('Dialog opened via modal context');
    }, 10);
  }, [parsePromptRequirements, requiredFileCount, requiredVariables, openFileSelectionDialog]);

  // Reset state (dialog closing is handled by the modal context)
  const resetState = useCallback(() => {
    setSelectedFiles([]);
    setVariables({});
    setError(null);
  }, []);

  // Handle file selection
  const handleFileSelection = useCallback((files: UploadedFile[], inputVariables: Record<string, string>) => {
    console.log('Submitting files and variables:', files.length, 'files');
    console.log('Variables:', inputVariables);

    setSelectedFiles(files);
    setVariables(inputVariables);

    // Validate that all required variables are filled
    const missingVariables = requiredVariables.filter(variable => !inputVariables[variable]);
    if (missingVariables.length > 0) {
      console.error('Missing required variables:', missingVariables);
      setError(new Error(`Please fill in all required variables: ${missingVariables.join(', ')}`));
      return;
    }

    // Store the current prompt in a local variable to avoid dependency issues
    const currentPrompt = selectedPrompt;
    if (currentPrompt) {
      // Use setTimeout to break the potential render cycle
      setTimeout(() => {
        handleSubmitPrompt(currentPrompt, files, inputVariables);
      }, 0);
    }
  }, [requiredVariables]);

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
        // Use clean URL without query parameters
        s3Url: file.s3Url || file.url,
        mimeType: file.type
      }));

      // Capture current values to avoid closure issues
      const currentUserId = userId;
      const currentSessionId = sessionId;
      const currentChatId = chatId;
      const currentStatusCallback = onStatusUpdate;

      // Create a user message with the prompt and files
      const fileNames = files.map(f => f.fileName).join(', ');
      const userMessage = `Please analyze these documents: ${fileNames}`;

      // Add the message to the chat UI by updating the status
      // This will trigger the chat interface to show the message
      if (currentStatusCallback) {
        // Pass the message to the chat interface
        currentStatusCallback('STARTED', 0, userMessage, true);
      }

      // Call API to send message with prompt and files
      // We include the userMessage in the API call to avoid sending a separate message
      const response = await apiService.sendMessage({
        promptId: prompt.promptId,
        userId: currentUserId,
        sessionId: currentSessionId,
        chatId: currentChatId,
        s3Files,
        message: userMessage  // Include the user message in the API call
      });

      if (response && response.requestId) {
        setRequestId(response.requestId);
        setIsPolling(true);

        if (currentStatusCallback) {
          // Update status to show processing in the chat interface
          currentStatusCallback('PROCESSING', 10);
        }
      }

      // Reset state after successful submission
      resetState();
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError(err instanceof Error ? err : new Error('Failed to submit prompt'));
    } finally {
      setIsSubmitting(false);
    }
  }, [resetState]);

  // Poll for status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && requestId) {
      // Store current values to avoid closure issues
      const currentRequestId = requestId;
      const currentStatusCallback = onStatusUpdate;

      intervalId = setInterval(async () => {
        try {
          const statusResponse = await apiService.checkStatus(currentRequestId);

          if (statusResponse) {
            if (currentStatusCallback) {
              currentStatusCallback(statusResponse.status, statusResponse.progress || 0);
            }

            // Stop polling when complete or error
            if (
              statusResponse.status === 'COMPLETED' ||
              statusResponse.status === 'FAILED' ||
              statusResponse.status === 'ERROR'
            ) {
              // Use function form of setState to avoid stale closures
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
  }, [isPolling, requestId]);

  return {
    selectedPrompt,
    selectedFiles,
    variables,
    isSubmitting,
    error,
    requiredFileCount,
    requiredVariables,
    openFileDialog,
    resetState,
    handleFileSelection
  };
};

export default usePromptFileHandler;
