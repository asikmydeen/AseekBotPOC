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

            // If we have files but no variables set, try to auto-assign files to variables
            if (uploadedFiles.length > 0 && Object.keys(promptVariables).length === 0) {
              console.log('Auto-assigning files to variables...');

              // Extract variables from prompt content
              if (storedPrompt.content) {
                const variableMatches = storedPrompt.content.match(/\$\{([^}]+)\}/g) || [];
                const extractedVariables = variableMatches.map(match => match.substring(2, match.length - 1));
                const uniqueVariables = [...new Set(extractedVariables)];

                // Try to match files to variables
                uniqueVariables.forEach((variable, index) => {
                  if (index < uploadedFiles.length) {
                    const file = uploadedFiles[index];
                    const lowerVar = variable.toLowerCase();
                    const lowerFileName = file.name.toLowerCase();

                    // Check for specific variable types
                    if (
                      (lowerVar.includes('sow') && lowerFileName.includes('sow')) ||
                      (lowerVar.includes('bid') && lowerFileName.includes('bid')) ||
                      (lowerVar.includes('doc') && index === 0) // First doc for generic doc variables
                    ) {
                      promptVariables[variable] = file.name;
                    } else if (index === 0 && lowerVar.includes('doc')) {
                      // First file for first doc variable
                      promptVariables[variable] = file.name;
                    } else if (index === 1 && lowerVar.includes('doc')) {
                      // Second file for second doc variable
                      promptVariables[variable] = file.name;
                    } else if (index === 2 && lowerVar.includes('doc')) {
                      // Third file for third doc variable
                      promptVariables[variable] = file.name;
                    }
                  }
                });

                // Save the auto-assigned variables
                if (Object.keys(promptVariables).length > 0) {
                  console.log('Auto-assigned variables:', promptVariables);
                  localStorage.setItem('promptVariables', JSON.stringify(promptVariables));
                }
              }
            }

            if (storedPrompt && storedPrompt.content) {
              // Process the prompt content with variables
              let processedContent = storedPrompt.content;

              // Replace variables in the content
              Object.entries(promptVariables).forEach(([key, value]) => {
                if (value) {
                  const regex = new RegExp(`\$\{${key}\}`, 'g');
                  processedContent = processedContent.replace(regex, value);
                }
              });

              // Check if there are still unreplaced variables
              const remainingVariables = processedContent.match(/\$\{([^}]+)\}/g) || [];
              if (remainingVariables.length > 0) {
                console.log('Warning: Some variables were not replaced:', remainingVariables);
              }

              // Create a more structured message that includes the variables
              const fileVariables = Object.entries(promptVariables)
                .filter(([key, value]) => value) // Only include variables with values
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');

              // Use the processed content as the message
              analysisText = `Please analyze these documents using the "${storedPrompt.title}" prompt with the following instructions:\n\n${processedContent}\n\nVariables:\n${fileVariables}`;
              console.log('Using stored prompt for analysis:', storedPrompt.title);

              // Create a mapping between variable names and files
              const variableToFileMap = {};

              // Map each variable to its corresponding file
              Object.entries(promptVariables).forEach(([variable, fileName]) => {
                // Find the file that matches this variable's filename
                const matchingFile = uploadedFiles.find(file => file.name === fileName);
                if (matchingFile) {
                  variableToFileMap[variable] = matchingFile;
                }
              });

              console.log('Variable to file mapping:', variableToFileMap);

              // Special handling for vendor-sow-comparison-analysis-v1 prompt
              let s3FilesArray = [];

              if (storedPrompt.promptId === 'vendor-sow-comparison-analysis-v1') {
                console.log('Using special formatting for vendor-sow-comparison-analysis-v1 prompt');

                // Find SOW file
                const sowFile = uploadedFiles.find(file =>
                  file.name.toLowerCase().includes('sow') ||
                  (file.type && file.type.toLowerCase().includes('word')));

                // Find LSK file
                const lskFile = uploadedFiles.find(file =>
                  file.name.toLowerCase().includes('lsk') ||
                  file.name.toLowerCase().includes('sin v2'));

                // Find Acme file
                const acmeFile = uploadedFiles.find(file =>
                  file.name.toLowerCase().includes('acme') ||
                  file.name.toLowerCase().includes('associates'));

                // Add files in the correct order with the correct names
                if (lskFile) {
                  s3FilesArray.push({
                    name: 'LSK_Bid',
                    fileName: lskFile.name,
                    s3Url: lskFile.url || lskFile.fileUrl || lskFile.s3Url || '',
                    mimeType: lskFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  });
                } else if (uploadedFiles.length > 0) {
                  // If no LSK file found, use the first file
                  s3FilesArray.push({
                    name: 'LSK_Bid',
                    fileName: uploadedFiles[0].name,
                    s3Url: uploadedFiles[0].url || uploadedFiles[0].fileUrl || uploadedFiles[0].s3Url || '',
                    mimeType: uploadedFiles[0].type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  });
                }

                if (acmeFile) {
                  s3FilesArray.push({
                    name: 'Acme_Bid',
                    fileName: acmeFile.name,
                    s3Url: acmeFile.url || acmeFile.fileUrl || acmeFile.s3Url || '',
                    mimeType: acmeFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  });
                } else if (uploadedFiles.length > 1) {
                  // If no Acme file found, use the second file
                  s3FilesArray.push({
                    name: 'Acme_Bid',
                    fileName: uploadedFiles[1].name,
                    s3Url: uploadedFiles[1].url || uploadedFiles[1].fileUrl || uploadedFiles[1].s3Url || '',
                    mimeType: uploadedFiles[1].type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  });
                }

                if (sowFile) {
                  s3FilesArray.push({
                    name: 'SOW',
                    fileName: sowFile.name,
                    s3Url: sowFile.url || sowFile.fileUrl || sowFile.s3Url || '',
                    mimeType: sowFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  });
                } else if (uploadedFiles.length > 2) {
                  // If no SOW file found, use the third file
                  s3FilesArray.push({
                    name: 'SOW',
                    fileName: uploadedFiles[2].name,
                    s3Url: uploadedFiles[2].url || uploadedFiles[2].fileUrl || uploadedFiles[2].s3Url || '',
                    mimeType: uploadedFiles[2].type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  });
                }
              } else {
                // Regular handling for other prompts
                s3FilesArray = uploadedFiles.map(file => {
                  // Find if this file is mapped to a variable
                  const variableEntry = Object.entries(variableToFileMap).find(([_, f]) => f.name === file.name);
                  const variableName = variableEntry ? variableEntry[0] : null;

                  // Use variable-based naming if available, otherwise use filename-based naming
                  const name = variableName ?
                    (variableName.includes('sow') ? 'SOW' :
                     variableName.includes('bid_doc_1') ? 'LSK_Bid' :
                     variableName.includes('bid_doc_2') ? 'Acme_Bid' :
                     file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_')) :
                    file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');

                  return {
                    name: name,
                    fileName: file.name,
                    s3Url: file.url || file.fileUrl || file.s3Url || '',
                    mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  };
                });
              }

              console.log('Created s3Files array with proper naming:', s3FilesArray);

              const metadata = {
                promptId: storedPrompt.promptId,
                variables: promptVariables,
                s3Files: s3FilesArray
              };

              // Store s3Files array directly in the payload
              localStorage.setItem('s3FilesForAPI', JSON.stringify(s3FilesArray));

              // Also store s3Files directly in the root of the payload
              localStorage.setItem('directS3Files', JSON.stringify(s3FilesArray));

              // Store metadata in localStorage for the API to pick up
              localStorage.setItem('promptMetadata', JSON.stringify(metadata));

              // Log the metadata for debugging
              console.log('Prompt metadata prepared for API:', metadata);
            }
          }
        } catch (error) {
          console.error('Error parsing stored prompt or variables:', error);
        }

        // Create s3Files array for the API if not already created
        const s3FilesJson = localStorage.getItem('s3FilesForAPI');
        if (!s3FilesJson) {
          const s3FilesArray = uploadedFiles.map(file => ({
            name: file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_'), // Create a clean name for the file
            fileName: file.name,
            s3Url: file.url || file.fileUrl || file.s3Url || '',
            mimeType: file.type || 'application/octet-stream'
          }));

          // Store s3Files array in localStorage for the API to pick up
          localStorage.setItem('s3FilesForAPI', JSON.stringify(s3FilesArray));
          console.log('Created s3Files in localStorage for API from useFileActions:', s3FilesArray);
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
        // Keep promptMetadata for the API to pick up

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