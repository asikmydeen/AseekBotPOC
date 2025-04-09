// app/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from './components/sidebar/AppSidebar';
import { useChatHistory } from './hooks/useChatHistory';
import { apiService } from './utils/apiService';
import { UploadedFile } from './types/shared';


// Dynamically import ChatInterface with SSR disabled
const ChatInterface = dynamic(() => import('./components/chat/ChatInterface').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading chat interface...</div>
});

function ChatApp() {
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [showDocumentAnalysisPrompt, setShowDocumentAnalysisPrompt] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preselectedFile, setPreselectedFile] = useState<UploadedFile | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  // Track which files came from the sidebar to prevent them from being removed
  const sidebarFilesRef = useRef<Set<string>>(new Set());

  // Add a list of files we've already added to chat to prevent duplicates
  const filesAddedToChatRef = useRef<Set<string>>(new Set());

  // Use ref to track if we're in the middle of a message update
  const isUpdatingRef = useRef(false);
  const lastMessagesRef = useRef<string>('');

  // Access chat history context
  const {
    activeChat,
    updateChatMessages,
    isChatLoading
  } = useChatHistory();

  const handleDocumentAnalysis = () => {
    setShowDocumentAnalysisPrompt(true);
  };

  const clearDocumentAnalysisPrompt = () => {
    // Clear localStorage when closing
    localStorage.removeItem('currentPrompt');
    localStorage.removeItem('promptVariables');
    setShowDocumentAnalysisPrompt(false);
  };

  // Create a handler for the triggerMessage that ensures document analysis is cleared
  const handleTriggerMessage = (message: string) => {
    clearDocumentAnalysisPrompt();
    setTriggerMessage(message);
  };

  const scrollToMessage = (timestamp: string) => {
    const messageElement = document.getElementById(`message-${timestamp}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  // Handle file click - could open in a new tab or in a viewer component
  const handleFileClick = useCallback((fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  }, []);

  // Handle file deletion - update the uploadedFiles state
  const handleFileDelete = useCallback((deletedFileKey: string) => {
    setUploadedFiles(prevFiles => {
      const updatedFiles = prevFiles.filter(file => file.fileKey !== deletedFileKey);

      // Also remove from the sidebar files reference if it exists
      if (sidebarFilesRef.current.has(deletedFileKey)) {
        sidebarFilesRef.current.delete(deletedFileKey);
      }

      // Also remove from filesAddedToChat if it exists
      if (filesAddedToChatRef.current.has(deletedFileKey)) {
        filesAddedToChatRef.current.delete(deletedFileKey);
      }

      return updatedFiles;
    });
  }, []);

  // When a prompt is clicked, set it as a trigger message
  const handlePromptClick = useCallback((prompt: any) => {
    console.log('Prompt clicked:', prompt.title);

    // Check if the prompt requires files or variables
    const requiresFiles = prompt.content && (
      prompt.content.includes('${') || // Has variables
      prompt.content.includes('files') || // Mentions files
      prompt.promptId.includes('analysis') || // Analysis prompt
      prompt.promptId.includes('comparison') // Comparison prompt
    );

    if (requiresFiles) {
      console.log('Prompt requires files or variables, showing file dropzone');
      // Store the prompt for later use
      localStorage.setItem('currentPrompt', JSON.stringify(prompt));
      // Show document analysis prompt to trigger file dropzone
      setShowDocumentAnalysisPrompt(true);
    } else {
      console.log('Regular prompt, sending directly');
      // Set the trigger message to send the prompt to the chat
      handleTriggerMessage(prompt.content);
    }
  }, []);

  // This function will be passed to the ChatInterface to sync messages
  // with debouncing to prevent update loops
  const syncMessages = useCallback((newMessages: any[]) => {
    if (!newMessages || !Array.isArray(newMessages) || isUpdatingRef.current) {
      return;
    }

    // Compare messages to avoid unnecessary updates
    const messagesString = JSON.stringify(newMessages);
    if (messagesString === lastMessagesRef.current) {
      return;
    }

    // Set updating flag and message ref
    isUpdatingRef.current = true;
    lastMessagesRef.current = messagesString;

    // Use setTimeout to break potential update cycles
    setTimeout(() => {
      try {
        updateChatMessages(newMessages);
      } catch (error) {
        console.error("Error updating chat messages:", error);
      } finally {
        // Reset updating flag after a delay
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 100);
      }
    }, 0);
  }, [updateChatMessages]);

  // This function will be passed to the ChatInterface to sync uploaded files
  const syncUploadedFiles = useCallback((newFiles: any[]) => {
    if (!newFiles || !Array.isArray(newFiles)) return;

    console.log('Syncing files from chat interface:', newFiles);

    // Track all processed file keys to avoid duplicates
    const processedKeys = new Set<string>();

    setUploadedFiles(prevFiles => {
      // Create a map of existing files for easy lookups
      const existingFilesMap = new Map();
      prevFiles.forEach(file => {
        const key = file.fileKey || '';
        if (key) {
          existingFilesMap.set(key, file);
        }
      });

      // Start with a copy of the existing sidebar files
      const result = prevFiles.filter(file => {
        const key = file.fileKey || '';
        // Keep file if it's in sidebarFilesRef
        if (key && sidebarFilesRef.current.has(key)) {
          processedKeys.add(key);
          return true;
        }
        return false;
      });

      // Process the new files from chat interface
      newFiles.forEach(file => {
        // Skip files already processed
        const fileKey = file.fileId || file.url || `${file.name}-${file.size}`;
        if (processedKeys.has(fileKey)) {
          return;
        }

        processedKeys.add(fileKey);

        // Create a properly formatted file object
        result.push({
          fileId: file.fileId || `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          fileName: file.name || 'Untitled File',
          fileKey: fileKey,
          uploadDate: new Date().toISOString(),
          fileSize: file.size || 0,
          fileType: file.type || 'application/octet-stream',
          presignedUrl: file.url || '',
          status: file.status || 'success',
        });
      });

      return result;
    });
  }, []);

  // Toggle sidebar and track its state
  const toggleSidebar = useCallback((isOpen: boolean) => {
    setSidebarOpen(isOpen);
  }, []);

  // Track messages to prevent duplicates
  const sentMessagesRef = useRef(new Set<string>());

  // Handle status updates from prompt processing
  const handleStatusUpdate = useCallback((status: string, progress: number, userMessage?: string, isPromptMessage: boolean = false) => {
    console.log(`Status update: ${status}, progress: ${progress}, isPromptMessage: ${isPromptMessage}`);

    // If this is a prompt message and we're just starting, we need to send the message to the chat
    if (isPromptMessage && status === 'STARTED' && userMessage) {
      // Check if we've already sent this message to prevent duplicates
      if (sentMessagesRef.current.has(userMessage)) {
        console.log('Skipping duplicate message:', userMessage);
        return;
      }

      // Check if we have a stored prompt
      try {
        const promptJson = localStorage.getItem('currentPrompt');
        if (promptJson) {
          const storedPrompt = JSON.parse(promptJson);
          if (storedPrompt && storedPrompt.title) {
            // Enhance the message with the prompt title
            userMessage = `Please analyze these documents using the "${storedPrompt.title}" prompt: ${userMessage}`;
            console.log('Enhanced message with prompt title:', userMessage);
          }
        }
      } catch (error) {
        console.error('Error parsing stored prompt:', error);
      }

      console.log('Sending prompt message to chat:', userMessage);
      // Add to sent messages set to prevent duplicates
      sentMessagesRef.current.add(userMessage);
      // Set the trigger message to send the user message to the chat
      setTriggerMessage(userMessage);
      return;
    }

    // Update the UI with the processing status
    setProcessingStatus(status);
    setProcessingProgress(progress);

    // If we have a completed status, show a notification or update the UI
    if (status === 'COMPLETED') {
      console.log('Processing completed successfully!');
      // Clear the processing status after a delay
      setTimeout(() => {
        setProcessingStatus('');
        setProcessingProgress(0);
      }, 2000);
    } else if (status === 'FAILED' || status === 'ERROR') {
      console.error('Processing failed:', status);
      // Clear the processing status after a delay
      setTimeout(() => {
        setProcessingStatus('');
        setProcessingProgress(0);
      }, 5000);
    }
  }, []);

  // Handle adding a file to chat from the sidebar
  const handleFileAddToChat = useCallback((file: {
    fileId: string;
    fileName: string;
    fileKey: string;
    uploadDate: string;
    fileSize: number;
    fileType?: string;
    presignedUrl?: string;
  }) => {
    // Check if file is valid
    if (!file || !file.fileName || file.fileSize === undefined) {
      console.error('Invalid file object for chat:', file);
      return;
    }

    // Get a proper fileKey
    const fileKey = file.fileKey || '';

    // Don't add the same file multiple times to chat
    if (fileKey && filesAddedToChatRef.current.has(fileKey)) {
      console.log('File already added to chat, skipping:', fileKey);
      return;
    }

    // Add to tracking sets
    if (fileKey) {
      sidebarFilesRef.current.add(fileKey);
      filesAddedToChatRef.current.add(fileKey);
      console.log('Added file to sidebar tracking:', fileKey);
    }

    // Map the file to the format expected by ChatInterface
    const mappedFile: UploadedFile = {
      name: file.fileName || 'Unnamed File',
      size: typeof file.fileSize === 'number' ? file.fileSize : 0,
      type: file.fileType || 'application/octet-stream',
      url: file.presignedUrl || '',
      fileId: file.fileId || fileKey || '',
      status: 'success',
      progress: 100,
    };

    console.log('Mapped file for chat:', mappedFile);

    // Set the preselected file - this will be picked up by ChatInterface
    setPreselectedFile(mappedFile);
  }, []);

  // Reset lastMessagesRef when active chat changes
  useEffect(() => {
    if (activeChat?.id) {
      lastMessagesRef.current = JSON.stringify(activeChat.messages || []);
      // Clear filesAddedToChat when changing chats
      filesAddedToChatRef.current.clear();
    }
  }, [activeChat?.id]);

  // Check for any leftover prompt data on component mount
  useEffect(() => {
    // Clear any leftover prompt data from localStorage
    // This ensures prompt components don't persist after page refresh
    if (!showDocumentAnalysisPrompt) {
      localStorage.removeItem('currentPrompt');
      localStorage.removeItem('promptVariables');
    }

    // Add a global function to handle file uploads directly
    // This allows components to add files without using events
    window.addExternalFileToUpload = (file: any) => {
      console.log('Global addExternalFileToUpload called with file:', file.name);
      if (file && file.name) {
        handleFileAddToChat(file);
      }
    };

    // Clean up the global function when component unmounts
    return () => {
      delete window.addExternalFileToUpload;
    };
  }, [handleFileAddToChat]);

  // Fetch user files on component mount
  useEffect(() => {
    async function fetchFiles() {
      try {
        const filesResponse = await apiService.getUserFiles();
        // Check if response has data and no errors
        if (filesResponse && filesResponse.data && !filesResponse.error) {
          const filesArray = Array.isArray(filesResponse.data) ? filesResponse.data : [];
          const mappedFiles = filesArray.map((file: { fileId: any; name: any; fileName: any; fileKey: any; presignedUrl: string; uploadDate: any; size: any; fileSize: any; type: any; fileType: any; url: any; }) => {
            const fileObj = {
              fileId: file.fileId || '',
              fileName: file.name || file.fileName || 'Untitled File',
              fileKey: file.fileKey || (file.presignedUrl ? file.presignedUrl.split('.amazonaws.com/')[1] : ''),
              uploadDate: file.uploadDate || new Date().toISOString(),
              fileSize: file.size || file.fileSize || 0,
              fileType: file.type || file.fileType || '',
              presignedUrl: file.presignedUrl || file.url || ''
            };

            // Add each file key to the sidebar files tracker
            const fileKey = fileObj.fileKey || '';
            if (fileKey) {
              sidebarFilesRef.current.add(fileKey);
            }

            return fileObj;
          });

          setUploadedFiles(mappedFiles);
          console.log('Initialized sidebar files:', sidebarFilesRef.current);
        } else {
          // If there's an error or data is undefined, set empty array
          console.warn('No valid files data received:',
            filesResponse?.error || 'Data property missing');
          setUploadedFiles([]);
        }
      } catch (error) {
        console.error('Error fetching user files:', error);
        setUploadedFiles([]);
      }
    }
    fetchFiles();
  }, []);

  // Clear preselectedFile after ChatInterface has handled it
  useEffect(() => {
    if (preselectedFile) {
      // Wait a bit to ensure ChatInterface has time to process the file
      const timer = setTimeout(() => {
        setPreselectedFile(null);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [preselectedFile]);

  return (
    <main id="main-content" role="main" className="flex h-screen w-full">
      <AppSidebar
        uploadedFiles={uploadedFiles}
        onFileClick={handleFileClick}
        onPromptClick={handlePromptClick}
        onToggle={toggleSidebar}
        onFileDelete={handleFileDelete}
        onFileAddToChat={handleFileAddToChat}
        sessionId={activeChat?.id || ''}
        chatId={activeChat?.id || ''}
        userId="test-user"
        onStatusUpdate={handleStatusUpdate}
      />
      <div className={`flex-1 h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-[300px] ml-0' : 'md:ml-[60px] ml-0'}`}>
        {/* Status indicator for prompt processing */}
        {processingStatus && processingStatus !== 'COMPLETED' && (
          <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <div>
              <div className="text-sm font-medium">Processing: {processingStatus}</div>
              <div className="w-full bg-blue-800 rounded-full h-1.5 mt-1">
                <div
                  className="bg-white h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {isChatLoading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ChatInterface
            key={activeChat?.id || 'default'} // This ensures the component is re-mounted when chat changes
            triggerMessage={triggerMessage}
            onTriggerHandled={() => setTriggerMessage(null)}
            showDocumentAnalysisPrompt={showDocumentAnalysisPrompt}
            clearDocumentAnalysisPrompt={clearDocumentAnalysisPrompt}
            onMessagesUpdate={syncMessages}
            onFilesUpdate={syncUploadedFiles}
            initialMessages={activeChat?.messages || []} // Pass the active chat messages with fallback
            externalFileToAdd={preselectedFile} // New prop for adding files from sidebar
          />
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ChatApp />
  );
}