import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../utils/apiService';
import { UploadedFile, Prompt, PromptVariable } from '../types/shared';
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
  const [variableTypes, setVariableTypes] = useState<Record<string, { type: string; options?: string[] }>>({});

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

      // Detect variable types based on naming patterns
      const detectedTypes: Record<string, { type: string; options?: string[] }> = {};

      uniqueVariables.forEach(variable => {
        // Start with default type
        let type = 'text';

        // Detect file-type variables
        if (
          variable.includes('_doc') ||
          variable.includes('_file') ||
          variable.includes('document') ||
          variable.includes('attachment')
        ) {
          type = 'file';
        }
        // Detect number-type variables
        else if (
          variable.includes('_count') ||
          variable.includes('_number') ||
          variable.includes('_amount') ||
          variable.includes('_qty') ||
          variable.includes('_quantity')
        ) {
          type = 'number';
        }
        // Detect date-type variables
        else if (
          variable.includes('_date') ||
          variable.includes('_time') ||
          variable.includes('_day')
        ) {
          type = 'date';
        }
        // Detect select-type variables
        else if (
          variable.includes('_type') ||
          variable.includes('_category') ||
          variable.includes('_option') ||
          variable.includes('_selection')
        ) {
          type = 'select';
          // Add some default options for common select types
          if (variable.includes('priority')) {
            detectedTypes[variable] = { type, options: ['Low', 'Medium', 'High'] };
          } else if (variable.includes('status')) {
            detectedTypes[variable] = { type, options: ['New', 'In Progress', 'Completed'] };
          } else {
            detectedTypes[variable] = { type };
          }
          return; // Skip the default assignment below
        }

        // Use prompt variables if available
        if (prompt.variables && prompt.variables.length > 0) {
          const promptVar = prompt.variables.find(v => v.name === variable);
          if (promptVar) {
            // If the prompt has defined this variable, use its source to determine type
            if (promptVar.source === 'FILE') {
              type = 'file';
            } else if (promptVar.sourceDetails?.type === 'number') {
              type = 'number';
            } else if (promptVar.sourceDetails?.type === 'date') {
              type = 'date';
            } else if (promptVar.sourceDetails?.type === 'select' && promptVar.sourceDetails?.options) {
              detectedTypes[variable] = {
                type: 'select',
                options: promptVar.sourceDetails.options.split(',').map(o => o.trim())
              };
              return; // Skip the default assignment below
            }
          }
        }

        detectedTypes[variable] = { type };
      });

      console.log('Detected variable types:', detectedTypes);
      setVariableTypes(detectedTypes);
    } else {
      setRequiredVariables([]);
      setVariableTypes({});
    }
  }, []);

  // Get the modal context
  const { openFileSelectionDialog } = useModal();

  // Reset state (dialog closing is handled by the modal context)
  const resetState = useCallback(() => {
    setSelectedFiles([]);
    setVariables({});
    setError(null);
  }, []);

  // Get the modal context at the top level of the hook
  const { currentPrompt: modalPrompt } = useModal();

  // Handle file selection - defined first to avoid circular dependency
  const handleFileSelection = useCallback((files: UploadedFile[], inputVariables: Record<string, string>, prompt?: Prompt) => {
    console.log('usePromptFileHandler: handleFileSelection called with', files.length, 'files');
    console.log('usePromptFileHandler: Variables:', inputVariables);
    console.log('usePromptFileHandler: Modal context prompt:', modalPrompt?.title || 'null');
    console.log('usePromptFileHandler: Local state prompt:', selectedPrompt?.title || 'null');

    setSelectedFiles(files);
    setVariables(inputVariables);

    // Validate that all required variables are filled
    const missingVariables = requiredVariables.filter(variable => !inputVariables[variable]);
    if (missingVariables.length > 0) {
      console.error('usePromptFileHandler: Missing required variables:', missingVariables);
      setError(new Error(`Please fill in all required variables: ${missingVariables.join(', ')}`));
      return;
    }

    // First try to use the prompt passed as a parameter
    let promptToUse = prompt;
    console.log('usePromptFileHandler: Prompt parameter:', prompt?.title || 'null');

    // If no prompt parameter, try to get it from our local state
    if (!promptToUse && selectedPrompt) {
      promptToUse = selectedPrompt;
      console.log('usePromptFileHandler: Using prompt from local state:', selectedPrompt.title);
    }

    // If still not found, try to get it from the ModalContext
    if (!promptToUse && modalPrompt) {
      console.log('usePromptFileHandler: Using prompt from ModalContext:', modalPrompt.title);
      // We need to create a new object to ensure React detects the change
      promptToUse = { ...modalPrompt };
      // Update our local state for future reference
      setSelectedPrompt(promptToUse);
    }

    if (promptToUse) {
      console.log('usePromptFileHandler: Using prompt:', promptToUse.title);
      // Use setTimeout to break the potential render cycle
      console.log('usePromptFileHandler: Setting timeout to call handleSubmitPrompt');
      setTimeout(() => {
        console.log('usePromptFileHandler: Timeout fired, calling handleSubmitPrompt');
        // Ensure all files have the required properties before submitting
        files.forEach(file => {
          if (!file.name) file.name = file.fileName || 'Unnamed file';
          if (!file.fileName) file.fileName = file.name;
          if (!file.s3Url) file.s3Url = file.url || '';
          if (!file.type) file.type = 'application/octet-stream';
        });

        console.log('usePromptFileHandler: Validated files before submitting:',
          files.map(f => ({ name: f.name, fileName: f.fileName, s3Url: f.s3Url })));

        handleSubmitPrompt(promptToUse, files, inputVariables);
      }, 0);
    } else {
      // If no prompt is found in state or ModalContext, show an error
      console.error('usePromptFileHandler: No prompt found in state or ModalContext!');
      console.error('usePromptFileHandler: This is likely because the prompt was not properly set when opening the dialog.');
      console.error('usePromptFileHandler: Please make sure to call openFileDialog with a valid prompt before submitting files.');
    }
  }, [requiredVariables, selectedPrompt, modalPrompt]);

  // Submit prompt with files and variables
  const handleSubmitPrompt = useCallback(async (
    prompt: Prompt,
    files: UploadedFile[],
    promptVariables: Record<string, string>
  ) => {
    console.log('usePromptFileHandler: handleSubmitPrompt called with prompt:', prompt.title);
    console.log('usePromptFileHandler: Files:', files.length, 'files');
    console.log('usePromptFileHandler: Variables:', promptVariables);

    if (!prompt) {
      console.error('usePromptFileHandler: No prompt provided!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Replace variables in prompt content
      let processedContent = prompt.content;
      Object.entries(promptVariables).forEach(([key, value]) => {
        processedContent = processedContent.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      });
      console.log('usePromptFileHandler: Processed content with variables:', processedContent.substring(0, 100) + '...');

      // Format files for API
      const s3Files = files.map(file => {
        // Log each file's properties to help debug
        console.log('usePromptFileHandler: Processing file for API:', {
          name: file.name,
          fileName: file.fileName,
          s3Url: file.s3Url,
          url: file.url,
          type: file.type
        });

        // Ensure all required properties are set
        if (!file.name) file.name = file.fileName || 'Unnamed file';
        if (!file.fileName) file.fileName = file.name || 'Unnamed file';
        if (!file.s3Url) file.s3Url = file.url || '';
        if (!file.type) file.type = 'application/octet-stream';

        return {
          name: file.name,
          fileName: file.fileName,
          // Use clean URL without query parameters
          s3Url: file.s3Url,
          mimeType: file.type
        };
      });
      console.log('usePromptFileHandler: Formatted s3Files for API:', s3Files);

      // Capture current values to avoid closure issues
      const currentUserId = userId;
      const currentSessionId = sessionId;
      const currentChatId = chatId;
      const currentStatusCallback = onStatusUpdate;
      console.log('usePromptFileHandler: Using session/chat IDs:', { currentUserId, currentSessionId, currentChatId });

      // Create a user message with the prompt and files
      const fileNames = files.map(f => f.fileName).join(', ');
      const userMessage = `Please analyze these documents: ${fileNames}`;

      // Add the message to the chat UI by updating the status
      // This will trigger the chat interface to show the message
      if (currentStatusCallback) {
        console.log('Calling status callback with prompt message:', userMessage);
        // Pass the message to the chat interface with isPromptMessage=true
        // The page.tsx handleStatusUpdate function will update the UI but NOT trigger a duplicate message
        currentStatusCallback('STARTED', 0, userMessage, true);
      }

      // Call API to send message with prompt and files
      // We include the userMessage in the API call to avoid sending a separate message
      console.log('usePromptFileHandler: Calling apiService.sendMessage with payload:', {
        promptId: prompt.promptId,
        userId: currentUserId,
        sessionId: currentSessionId,
        chatId: currentChatId,
        s3FilesCount: s3Files.length,
        message: userMessage
      });

      // Variable to store the API response
      let apiResponse: any = null;

      try {
        // Create the payload with all required fields
        const payload = {
          promptId: prompt.promptId,
          userId: currentUserId,
          sessionId: currentSessionId,
          chatId: currentChatId,
          s3Files,
          message: userMessage  // Include the user message in the API call
        };

        // Log the exact payload being sent to the API
        console.log('usePromptFileHandler: Sending API payload:', JSON.stringify(payload, null, 2));

        // Make the API call
        console.log('usePromptFileHandler: Calling apiService.sendMessage with payload');
        apiResponse = await apiService.sendMessage(payload);

        console.log('usePromptFileHandler: API response:', apiResponse);

        if (apiResponse && apiResponse.requestId) {
          console.log('usePromptFileHandler: Prompt API call successful, got requestId:', apiResponse.requestId);
          setRequestId(apiResponse.requestId);
          setIsPolling(true);

          // Store the request ID in localStorage to ensure it's tracked across page refreshes
          try {
            let pending: Record<string, { status: string }> = {};
            const stored = localStorage.getItem('pendingRequests');
            if (stored) {
              pending = JSON.parse(stored);
            }
            pending[apiResponse.requestId] = { status: 'PROCESSING' };
            localStorage.setItem('pendingRequests', JSON.stringify(pending));
            console.log('usePromptFileHandler: Stored request ID in localStorage:', apiResponse.requestId);
          } catch (e) {
            console.error('usePromptFileHandler: Error storing request ID in localStorage:', e);
          }
        } else {
          console.error('usePromptFileHandler: API response missing requestId:', apiResponse);
        }
      } catch (apiError) {
        console.error('usePromptFileHandler: API call failed:', apiError);
        throw apiError; // Re-throw to be caught by the outer try/catch
      }

      if (currentStatusCallback) {
        // Update status to show processing in the chat interface
        // This will trigger the typing indicator and progress bar
        currentStatusCallback('PROCESSING', 10);
        console.log('usePromptFileHandler: Updated status to PROCESSING');

        // Start polling for status updates
        if (apiResponse && apiResponse.requestId) {
          setIsPolling(true);
          setRequestId(apiResponse.requestId);
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

  // Open dialog with the selected prompt
  const openFileDialog = useCallback((prompt: Prompt) => {
    console.log('usePromptFileHandler: openFileDialog called for prompt:', prompt.title);
    console.log('usePromptFileHandler: Prompt ID:', prompt.promptId);

    // Set the selected prompt locally - this is critical for the handleFileSelection callback
    // We need to create a new object to ensure React detects the change
    const promptCopy = { ...prompt };
    setSelectedPrompt(promptCopy);
    console.log('usePromptFileHandler: Set selectedPrompt state to:', promptCopy.title);
    setError(null);

    // Parse prompt requirements first
    if (prompt && prompt.content) {
      console.log('usePromptFileHandler: Parsing prompt requirements for:', prompt.title);
      console.log('usePromptFileHandler: Prompt content:', prompt.content.substring(0, 100) + '...');

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
        console.log('usePromptFileHandler: Prompt ID suggests file requirements, setting fileCount to', fileCount);
      }

      // Look for explicit file mentions
      const fileMatch = prompt.content.match(/(\d+)\s+files?/i);
      if (fileMatch && fileMatch[1]) {
        fileCount = Math.max(fileCount, parseInt(fileMatch[1], 10));
        console.log('usePromptFileHandler: Found explicit file mention in content, setting fileCount to', fileCount);
      }

      // Count document references like ${doc_1}, ${sow_doc}, etc.
      const docMatches = prompt.content.match(/\${([a-zA-Z0-9_]+_doc[a-zA-Z0-9_]*|[a-zA-Z0-9_]*doc_[a-zA-Z0-9_]+)}/g);
      if (docMatches) {
        fileCount = Math.max(fileCount, docMatches.length);
      }

      console.log('Detected required file count:', fileCount);

      // Find variables in the format ${VARIABLE_NAME}
      const variableMatches = prompt.content.match(/\${([A-Za-z0-9_]+)}/g);
      let variables: string[] = [];
      let types: Record<string, { type: string; options?: string[] }> = {};

      if (variableMatches) {
        variables = [...new Set(
          variableMatches.map(match => match.replace(/\${(.*)}/,'$1'))
        )];
        console.log('Detected variables:', variables);

        // Detect variable types based on naming patterns
        variables.forEach(variable => {
          // Start with default type
          let type = 'text';

          // Detect file-type variables
          if (
            variable.includes('_doc') ||
            variable.includes('_file') ||
            variable.includes('document') ||
            variable.includes('attachment')
          ) {
            type = 'file';
          }
          // Detect number-type variables
          else if (
            variable.includes('_count') ||
            variable.includes('_number') ||
            variable.includes('_amount') ||
            variable.includes('_qty') ||
            variable.includes('_quantity')
          ) {
            type = 'number';
          }
          // Detect date-type variables
          else if (
            variable.includes('_date') ||
            variable.includes('_time') ||
            variable.includes('_day')
          ) {
            type = 'date';
          }
          // Detect select-type variables
          else if (
            variable.includes('_type') ||
            variable.includes('_category') ||
            variable.includes('_option') ||
            variable.includes('_selection')
          ) {
            type = 'select';
            // Add some default options for common select types
            if (variable.includes('priority')) {
              types[variable] = { type, options: ['Low', 'Medium', 'High'] };
            } else if (variable.includes('status')) {
              types[variable] = { type, options: ['New', 'In Progress', 'Completed'] };
            } else {
              types[variable] = { type };
            }
            return; // Skip the default assignment below
          }

          types[variable] = { type };
        });

        console.log('Detected variable types:', types);
        setVariableTypes(types);
      }

      // Set the state and immediately use the values
      setRequiredFileCount(fileCount);
      setRequiredVariables(variables);

      // Use the global modal context to open the dialog with the parsed values
      console.log('usePromptFileHandler: Setting timeout to call openFileSelectionDialog');
      setTimeout(() => {
        console.log('usePromptFileHandler: Timeout fired, calling openFileSelectionDialog with:', {
          promptTitle: prompt.title,
          fileCount,
          variablesCount: variables.length,
          variableTypesCount: Object.keys(variableTypes).length
        });

        try {
          openFileSelectionDialog(
            prompt,
            fileCount,  // Use the local variable instead of state
            variables,  // Use the local variable instead of state
            handleFileSelection,
            variableTypes  // Pass the detected variable types
          );
          console.log('usePromptFileHandler: Dialog opened via modal context successfully');
        } catch (error) {
          console.error('usePromptFileHandler: Error opening dialog via modal context:', error);
        }
      }, 10);
    } else {
      // Fallback if no content
      console.log('usePromptFileHandler: No prompt content, using fallback with no files or variables');
      try {
        openFileSelectionDialog(
          prompt,
          0,
          [],
          handleFileSelection,
          {}
        );
        console.log('usePromptFileHandler: Fallback dialog opened successfully');
      } catch (error) {
        console.error('usePromptFileHandler: Error opening fallback dialog:', error);
      }
    }
  }, [openFileSelectionDialog, handleFileSelection]);

  // Note: resetState is defined earlier in the file

  // Poll for status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPolling && requestId) {
      // Store current values to avoid closure issues
      const currentRequestId = requestId;
      const currentStatusCallback = onStatusUpdate;

      console.log('Starting polling for request ID:', currentRequestId);

      intervalId = setInterval(async () => {
        try {
          console.log('Polling status for request ID:', currentRequestId);
          const statusResponse = await apiService.checkStatus(currentRequestId);

          if (statusResponse) {
            console.log('Status response:', statusResponse.status, 'Progress:', statusResponse.progress || 0);

            if (currentStatusCallback) {
              // Update the status in the UI
              // For COMPLETED status, pass the entire status response as a JSON string
              if (statusResponse.status === 'COMPLETED') {
                console.log('Status response completed with completion data:', {
                  hasCompletion: !!statusResponse.completion,
                  completionLength: statusResponse.completion?.length || 0,
                  hasAggregatedResults: !!statusResponse.aggregatedResults
                });

                // Pass the entire status response as a JSON string
                // This will allow the page component to extract the completion data
                currentStatusCallback(
                  statusResponse.status,
                  100
                );
              } else {
                // For other statuses, just update the progress
                currentStatusCallback(statusResponse.status, statusResponse.progress || 0);
              }
            }

            // Stop polling when complete or error
            if (
              statusResponse.status === 'COMPLETED' ||
              statusResponse.status === 'FAILED' ||
              statusResponse.status === 'ERROR'
            ) {
              console.log('Request completed or failed, stopping polling');

              // Use function form of setState to avoid stale closures
              setIsPolling(false);
              setRequestId(null);

              // Remove from localStorage when complete
              try {
                let pending: Record<string, unknown> = {};
                const stored = localStorage.getItem('pendingRequests');
                if (stored) {
                  pending = JSON.parse(stored);
                  if (pending[currentRequestId]) {
                    delete pending[currentRequestId];
                    localStorage.setItem('pendingRequests', JSON.stringify(pending));
                    console.log('Removed completed request from localStorage:', currentRequestId);
                  }
                }
              } catch (e) {
                console.error('Error removing request from localStorage:', e);
              }
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
    variableTypes,
    openFileDialog,
    resetState,
    handleFileSelection
  };
};

export default usePromptFileHandler;
