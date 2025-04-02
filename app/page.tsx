// app/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from './components/AppSidebar';
import { useChatHistory } from './context/ChatHistoryContext';
import { getUserFilesApi } from './api/advancedApi';
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

  // Track which files came from the sidebar to prevent them from being removed
  const sidebarFilesRef = useRef<Set<string>>(new Set());

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

      return updatedFiles;
    });
  }, []);

  // When a prompt is clicked, set it as a trigger message
  const handlePromptClick = useCallback((prompt: string) => {
    handleTriggerMessage(prompt);
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

    // Get a unique key for each file for deduplication
    const getFileKey = (file: any) => {
      if (file.url && typeof file.url === 'string') {
        return file.url.split('/').pop() || `${file.name}-${file.size}`;
      }
      return `${file.name}-${file.size}`;
    };

    setUploadedFiles(prevFiles => {
      // Create a map of existing files for easy lookups
      const existingFilesMap = new Map();
      prevFiles.forEach(file => {
        const key = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('/').pop() : `${file.fileName}-${file.fileSize}`);
        existingFilesMap.set(key, file);
      });

      // Process new files
      const newProcessedFiles = newFiles.map(file => {
        const fileKey = getFileKey(file);

        // Check if we should update an existing file
        if (existingFilesMap.has(fileKey) && !sidebarFilesRef.current.has(fileKey)) {
          // This is an existing file uploaded via the chat interface, update it
          const existingFile = existingFilesMap.get(fileKey);
          return {
            ...existingFile,
            fileName: file.name || existingFile.fileName,
            fileSize: file.size || existingFile.fileSize,
            fileType: file.type || existingFile.fileType,
            presignedUrl: file.url || existingFile.presignedUrl,
            status: file.status || 'success',
          };
        } else if (!existingFilesMap.has(fileKey)) {
          // This is a new file uploaded via the chat interface
          return {
            fileId: file.fileId || `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            fileName: file.name || 'Untitled File',
            fileKey: fileKey,
            uploadDate: new Date().toISOString(),
            fileSize: file.size || 0,
            fileType: file.type || 'application/octet-stream',
            presignedUrl: file.url || '',
            status: file.status || 'success',
          };
        }

        // If the file exists and is from the sidebar, keep the original
        return existingFilesMap.get(fileKey);
      });

      // Combine existing sidebar files with updated/new files
      const result = Array.from(existingFilesMap.values()).filter(file => {
        const key = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('/').pop() : `${file.fileName}-${file.fileSize}`);
        return sidebarFilesRef.current.has(key);
      });

      // Add files that aren't from the sidebar
      newProcessedFiles.forEach(newFile => {
        const fileKey = newFile.fileKey;
        if (!sidebarFilesRef.current.has(fileKey)) {
          result.push(newFile);
        }
      });

      console.log('Updated uploaded files state:', result);
      return result;
    });
  }, []);

  // Toggle sidebar and track its state
  const toggleSidebar = useCallback((isOpen: boolean) => {
    setSidebarOpen(isOpen);
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

    // Track this file as coming from the sidebar to prevent it from being removed
    const fileKey = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('/').pop() : `${file.fileName}-${file.fileSize}`);
    sidebarFilesRef.current.add(fileKey);

    console.log('Added file to sidebar tracking:', fileKey, sidebarFilesRef.current);

    // Map the local file properties to the shared UploadedFile format
    const mappedFile: UploadedFile = {
      name: file.fileName || 'Unnamed File',
      size: typeof file.fileSize === 'number' ? file.fileSize : 0,
      type: file.fileType || 'application/octet-stream',
      url: file.presignedUrl || '',
      fileId: file.fileId || '',
      status: 'success',
      progress: 100,
      // Add a property to indicate this file should not be removed from the sidebar
      preserveInSidebar: true
    };

    console.log('Mapped file for chat:', mappedFile);
    setPreselectedFile(mappedFile);
  }, []);

  // Reset lastMessagesRef when active chat changes
  useEffect(() => {
    if (activeChat?.id) {
      lastMessagesRef.current = JSON.stringify(activeChat.messages || []);
    }
  }, [activeChat?.id]);

  // Fetch user files on component mount
  useEffect(() => {
    async function fetchFiles() {
      try {
        const filesResponse = await getUserFilesApi();
        // Check if response has data and no errors
        if (filesResponse && filesResponse.data && !filesResponse.error) {
          const filesArray = Array.isArray(filesResponse.data) ? filesResponse.data : [];
          const mappedFiles = filesArray.map(file => {
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
            const fileKey = fileObj.fileKey || (fileObj.presignedUrl ? fileObj.presignedUrl.split('/').pop() : `${fileObj.fileName}-${fileObj.fileSize}`);
            sidebarFilesRef.current.add(fileKey);

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

  return (
    <main id="main-content" role="main" className="flex h-screen w-full">
      <AppSidebar
        uploadedFiles={uploadedFiles}
        onFileClick={handleFileClick}
        onPromptClick={handlePromptClick}
        onToggle={toggleSidebar}
        onFileDelete={handleFileDelete}
        onFileAddToChat={handleFileAddToChat}
      />
      <div className={`flex-1 h-screen transition-all duration-300 ${sidebarOpen ? 'md:ml-[300px] ml-0' : 'md:ml-[60px] ml-0'}`}>
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