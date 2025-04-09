'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../utils/apiService';
import { useTheme } from '../../hooks/useTheme';
import { useChatHistory } from '../../hooks/useChatHistory';
import usePromptsManager from '../../hooks/usePromptsManager';
import HistoryList from '../chat/HistoryList';
import CreatePromptModal from '../prompts/CreatePromptModal';
import EditPromptModal from '../prompts/EditPromptModal';
import DeletePromptConfirmation from '../prompts/DeletePromptConfirmation';
import {
  sidebarAnimationVariants,
  sidebarTransition,
  sidebarCSSVariables,
  getSidebarStyles
} from '../../styles/sidebarStyles';

// Import sub-components
import {
  SidebarHeader,
  SidebarTabs,
  FilesList,
  PromptSection,
  SettingsSection,
  SidebarOverlay
} from './index';

interface UploadedFile {
  fileId: string;
  fileName: string;
  fileKey: string;
  uploadDate: string;
  fileSize: number;
  fileType?: string;
  presignedUrl?: string;
}

interface AppSidebarProps {
  uploadedFiles: UploadedFile[];
  onFileClick: (fileUrl: string) => void;
  onPromptClick: (prompt: string) => void;
  onToggle?: (isOpen: boolean) => void;
  onFileAddToChat?: (file: UploadedFile) => void;
  onFileDelete?: (fileKey: string) => void;
}

export default function AppSidebar({
  uploadedFiles,
  onFileClick,
  onPromptClick,
  onToggle,
  onFileAddToChat,
  onFileDelete
}: AppSidebarProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { createChat } = useChatHistory();
  const [isMobile, setIsMobile] = useState(false);

  // Get all styles for the sidebar
  const styles = getSidebarStyles(isDarkMode);

  // Prompt management hooks
  const {
    prompts,
    isSubmitting,
    isDeleting,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    promptToEditOrDelete,
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeAllModals,
    handleCreatePrompt,
    handleUpdatePrompt,
    handleDeletePrompt,
    handleSelectPrompt
  } = usePromptsManager();

  // Default to closed on mobile, open on larger screens
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return true;
  });
  const [activeTab, setActiveTab] = useState<string>('history');

  // Add effect to handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640 && isOpen) { // sm breakpoint
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onToggle]);

  // Add useEffect to check window width after component mount
  useEffect(() => {
    // This only runs on the client
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  const handleNewChat = () => {
    createChat();
    if (!isOpen) {
      setIsOpen(true);
      if (onToggle) onToggle(true);
    }
    setActiveTab('history');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleAddToChatClick = (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling

    // Validate file object to ensure it's not empty
    if (!file || typeof file !== 'object' || Object.keys(file).length === 0) {
      console.error('Invalid file object for chat:', file);
      return;
    }

    // Validate required properties
    if (!file.fileName || file.fileSize === undefined) {
      console.error('Missing required file properties:', file);
      return;
    }

    // If onFileAddToChat callback is provided, use it
    if (onFileAddToChat) {
      // Ensure we're passing a complete file object
      const completeFile = {
        fileId: file.fileId || `file-${Date.now()}`, // Generate a temporary ID if missing
        fileName: file.fileName,
        fileKey: file.fileKey || (file.presignedUrl ? file.presignedUrl.split('/').pop() || file.fileName : file.fileName),
        uploadDate: file.uploadDate || new Date().toISOString(),
        fileSize: typeof file.fileSize === 'number' ? file.fileSize : 0,
        fileType: file.fileType || 'application/octet-stream',
        presignedUrl: file.presignedUrl || ''
      };

      console.log('Adding file to chat:', completeFile);
      onFileAddToChat(completeFile);
    } else if (file.presignedUrl) {
      // Otherwise, fall back to onFileClick
      onFileClick(file.presignedUrl);
    }
  };

  const handleDownloadClick = async (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      // Extract fileKey from presignedUrl or use fileKey directly
      const fileKey = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('.amazonaws.com/')[1] : '');

      if (!fileKey) {
        console.error('File key not found');
        return;
      }

      // Call the API service to get a presigned URL
      const response = await apiService.downloadFile(fileKey);

      if (response && (response.fileUrl || response.url)) {
        // Open the download URL in a new tab
        window.open(response.fileUrl || response.url, '_blank');
      } else {
        console.error('Download URL not found in response');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDeleteClick = async (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      // Extract fileKey from presignedUrl or use fileKey directly
      const fileKey = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('.amazonaws.com/')[1] : '');

      if (!fileKey) {
        console.error('File key not found');
        return;
      }

      // Call the API service to delete the file
      const response = await apiService.deleteFile(fileKey);

      if (response && response.success) {
        console.log('File deleted successfully');
        // Call the onFileDelete callback if provided
        if (onFileDelete) {
          onFileDelete(fileKey);
          // Parent component should update its file list accordingly
        }
      } else {
        console.error('Error deleting file:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleAnalyzeClick = (file: UploadedFile, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      // Extract fileKey from presignedUrl or use fileKey directly
      const fileKey = file.fileKey || (file.presignedUrl ? file.presignedUrl.split('.amazonaws.com/')[1] : '');

      if (!fileKey) {
        console.error('File key not found');
        return;
      }

      // Here you would call your analysis API
      console.log('Performing analysis on file:', file.fileName);
      // Example: startAsyncDocumentAnalysis(fileKey);

      // For now, just add the file to chat as a fallback action
      if (onFileAddToChat) {
        onFileAddToChat(file);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
    }
  };

  return (
    <>
      <SidebarOverlay 
        isVisible={isOpen && isMobile} 
        styles={styles} 
        onClose={toggleSidebar} 
      />
      
      <motion.div
        className={styles.container}
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarAnimationVariants}
        custom={isDarkMode}
        transition={sidebarTransition}
        style={sidebarCSSVariables}
      >
        {/* Sidebar Header */}
        <SidebarHeader 
          isOpen={isOpen} 
          styles={styles} 
          onNewChat={handleNewChat} 
          onToggle={toggleSidebar} 
        />

        {/* Sidebar Tabs */}
        {isOpen && (
          <SidebarTabs 
            activeTab={activeTab} 
            styles={styles} 
            onTabChange={handleTabChange} 
            isDarkMode={isDarkMode} 
          />
        )}

        {/* Sidebar Content */}
        <div className={styles.content.container}>
          {isOpen && activeTab === 'history' && (
            <HistoryList isDarkMode={isDarkMode} />
          )}

          {isOpen && activeTab === 'files' && (
            <FilesList 
              uploadedFiles={uploadedFiles}
              styles={styles}
              onAddToChat={handleAddToChatClick}
              onDownload={handleDownloadClick}
              onAnalyze={handleAnalyzeClick}
              onDelete={handleDeleteClick}
            />
          )}

          {isOpen && activeTab === 'prompts' && (
            <PromptSection 
              styles={styles}
              isDarkMode={isDarkMode}
              prompts={prompts}
              onPromptClick={(prompt) => onPromptClick(prompt.content)}
              onPromptSelect={handleSelectPrompt}
              onCreatePrompt={openCreateModal}
              onEditPrompt={openEditModal}
              onDeletePrompt={(promptId) => {
                const promptToDelete = prompts.find(p => p.promptId === promptId);
                if (promptToDelete) {
                  openDeleteModal(promptToDelete);
                }
              }}
            />
          )}

          {isOpen && activeTab === 'settings' && (
            <SettingsSection 
              styles={styles}
              isDarkMode={isDarkMode}
              onToggleTheme={toggleTheme}
            />
          )}
        </div>

        {/* Prompt Modals */}
        <CreatePromptModal
          isOpen={isCreateModalOpen}
          onClose={closeAllModals}
          onSubmit={handleCreatePrompt}
          isDarkMode={isDarkMode}
          isSubmitting={isSubmitting}
        />

        <EditPromptModal
          isOpen={isEditModalOpen}
          prompt={promptToEditOrDelete}
          onClose={closeAllModals}
          onSubmit={handleUpdatePrompt}
          isDarkMode={isDarkMode}
          isSubmitting={isSubmitting}
        />

        <DeletePromptConfirmation
          isOpen={isDeleteModalOpen}
          promptTitle={promptToEditOrDelete?.title || ''}
          onClose={closeAllModals}
          onConfirm={handleDeletePrompt}
          isDarkMode={isDarkMode}
          isDeleting={isDeleting}
        />
      </motion.div>
    </>
  );
}
