// app/page.tsx
"use client";
import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import AppSidebar from './components/AppSidebar';

// Dynamically import ChatInterface with SSR disabled
const ChatInterface = dynamic(() => import('./components/chat/ChatInterface').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">Loading chat interface...</div>
});

export default function Home() {
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [showDocumentAnalysisPrompt, setShowDocumentAnalysisPrompt] = useState<boolean>(false);
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Create ref without type definition initially
  const chatInterfaceRef = useRef(null);

  const handleDocumentAnalysis = () => {
    setShowDocumentAnalysisPrompt(true);
  };

  const clearDocumentAnalysisPrompt = () => {
    setShowDocumentAnalysisPrompt(false);
  };

  // Create a handler for the triggerMessage that ensures document analysis is cleared
  const handleTriggerMessage = (message) => {
    // Clear any active document analysis before triggering new message
    clearDocumentAnalysisPrompt();
    // Set the trigger message
    setTriggerMessage(message);
  };

  const scrollToMessage = (timestamp) => {
    const messageElement = document.getElementById(`message-${timestamp}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  // Handle file click - could open in a new tab or in a viewer component
  const handleFileClick = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // When a prompt is clicked, set it as a trigger message
  const handlePromptClick = (prompt) => {
    handleTriggerMessage(prompt);
  };

  // This function will be passed to the ChatInterface to sync messages
  const syncMessages = (newMessages) => {
    setMessages(newMessages);
  };

  // This function will be passed to the ChatInterface to sync uploaded files
  const syncUploadedFiles = (newFiles) => {
    setUploadedFiles(newFiles);
  };

  // Toggle sidebar and track its state
  const toggleSidebar = (isOpen) => {
    setSidebarOpen(isOpen);
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar
        messages={messages}
        filteredMessages={messages}
        uploadedFiles={uploadedFiles}
        onHistoryClick={scrollToMessage}
        onPinnedClick={scrollToMessage}
        onFileClick={handleFileClick}
        onPromptClick={handlePromptClick}
        onToggle={toggleSidebar}
      />
      <div className={`flex-1 h-screen ${sidebarOpen ? 'ml-[300px]' : 'ml-[60px]'} transition-all duration-300`}>
        <ChatInterface
          triggerMessage={triggerMessage}
          onTriggerHandled={() => setTriggerMessage(null)}
          showDocumentAnalysisPrompt={showDocumentAnalysisPrompt}
          clearDocumentAnalysisPrompt={clearDocumentAnalysisPrompt}
          onMessagesUpdate={syncMessages}
          onFilesUpdate={syncUploadedFiles}
        />
      </div>
    </div>
  );
}