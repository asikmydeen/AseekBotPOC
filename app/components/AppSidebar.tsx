// app/components/AppSidebar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    sidebarAnimationVariants,
    sidebarTransition,
    sidebarCSSVariables,
    getSidebarStyles
} from '../styles/sidebarStyles';
import {
    MdPushPin,
    MdHistory,
    MdSettings,
    MdAccountCircle,
    MdChevronLeft,
    MdChevronRight,
    MdAttachment,
    MdPalette,
    MdInfoOutline,
    MdSupportAgent,
    MdLightbulb,
    MdAdd,
    MdLibraryAdd,
    MdDelete,
    MdAnalytics
} from 'react-icons/md';
import { FiHelpCircle, FiDownload } from 'react-icons/fi';
import {
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFileImage,
    FaFileAlt,
    FaFileCsv,
    FaFile
} from 'react-icons/fa';
import { apiService } from '../utils/apiService';
import { useTheme } from '../hooks/useTheme';
import { useChatHistory } from '../hooks/useChatHistory';
import { usePrompts } from '../hooks/usePrompts';
import usePromptsManager from '../hooks/usePromptsManager';
import HistoryList from './chat/HistoryList';
import PromptsList from './prompts/PromptsList';
import CreatePromptModal from './prompts/CreatePromptModal';
import EditPromptModal from './prompts/EditPromptModal';
import DeletePromptConfirmation from './prompts/DeletePromptConfirmation';

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
    const { createChat, activeChat, pinnedChats, recentChats, loadChat } = useChatHistory();
    const [isMobile, setIsMobile] = useState(false);

    // Get all styles for the sidebar
    const styles = getSidebarStyles(isDarkMode);

    // Prompt management hooks
    const {
        prompts,
        isLoading,
        error,
        selectedPrompt,
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

    // Using sidebarAnimationVariants from sidebarStyles.ts

    const toggleSidebar = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (onToggle) {
            onToggle(newIsOpen);
        }
    };

    const sidebarOverlay = isOpen && isMobile ? (
        <div
            className={styles.overlay}
            onClick={toggleSidebar}
            aria-hidden="true"
        />
    ) : null;

    const handleNewChat = () => {
        createChat();
        if (!isOpen) {
            setIsOpen(true);
            if (onToggle) onToggle(true);
        }
        setActiveTab('history');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === undefined || bytes === null || bytes <= 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType: string | undefined) => {
        if (!fileType) return <FaFile className="text-gray-500" />; // Return default icon if fileType is undefined
        if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
        if (fileType.includes('word') || fileType.includes('docx')) return <FaFileWord className="text-blue-500" />;
        if (fileType.includes('text') || fileType.includes('txt')) return <FaFileAlt className="text-gray-500" />;
        if (fileType.includes('csv')) return <FaFileCsv className="text-green-500" />;
        if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return <FaFileExcel className="text-green-600" />;
        if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
        return <FaFile className="text-gray-500" />;
    };

    const onDownloadClick = async (file: UploadedFile, e: React.MouseEvent) => {
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

    const onDeleteClick = async (file: UploadedFile, e: React.MouseEvent) => {
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

    const onAnalyzeClick = (file: UploadedFile, e: React.MouseEvent) => {
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

    const onAddToChatClick = (file: UploadedFile, e: React.MouseEvent) => {
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

    return (
        <>
            {sidebarOverlay}
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
                <div className={styles.header.container}>
                    {isOpen && (
                        <div className="flex items-center justify-between w-full">
                            <h2 className={styles.header.title}>
                                <span className="mr-2">AseekBot</span>
                            </h2>
                            <button
                                onClick={handleNewChat}
                                className={styles.header.newChatButton}
                                aria-label="New Chat"
                                title="New Chat"
                            >
                                <MdAdd size={24} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={styles.header.toggleButton}
                        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        {isOpen ? <MdChevronLeft size={24} /> : <MdChevronRight size={24} />}
                    </button>
                </div>

                {/* Sidebar Tabs */}
                {isOpen && (
                    <div className={styles.tabs.container}>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={styles.tabs.tab(activeTab === 'history', isDarkMode)}
                            aria-label="Chat History"
                            title="Chat History"
                        >
                            <MdHistory size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={styles.tabs.tab(activeTab === 'files', isDarkMode)}
                            aria-label="Uploaded Files"
                            title="Uploaded Files"
                        >
                            <MdAttachment size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={styles.tabs.tab(activeTab === 'prompts', isDarkMode)}
                            aria-label="Saved Prompts"
                            title="Saved Prompts"
                        >
                            <MdLightbulb size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={styles.tabs.tab(activeTab === 'settings', isDarkMode)}
                            aria-label="Settings"
                            title="Settings"
                        >
                            <MdSettings size={20} />
                        </button>
                    </div>
                )}

                {/* Sidebar Content */}
                <div className={styles.content.container}>
                    {isOpen && activeTab === 'history' && (
                        <HistoryList isDarkMode={isDarkMode} />
                    )}

                    {isOpen && activeTab === 'files' && (
                        <div className={styles.files.container}>
                            <div className={styles.content.section.header}>
                                <MdAttachment className="mr-2" size={20} />
                                <h3 className={styles.content.section.title}>Uploaded Files</h3>
                            </div>
                            {uploadedFiles && uploadedFiles.length > 0 ? (
                                <div className={styles.files.list}>
                                    {uploadedFiles.filter(file => file && file.fileName).map((file, index) => (
                                        <div
                                            key={`file-${index}`}
                                            className={styles.files.item}
                                        >
                                            <div className={styles.files.itemContent}>
                                                <div className="flex items-center w-full">
                                                    <span className={styles.files.itemIndex}>{index + 1}.</span>
                                                    <div className={styles.files.iconContainer}>
                                                        {getFileIcon(file.fileType)}
                                                    </div>
                                                    <div className={styles.files.fileInfo}>
                                                        <p className={styles.files.fileName}>{file.fileName}</p>
                                                        <p className={styles.files.fileSize}>{formatFileSize(file.fileSize)}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.files.actionsContainer}>
                                                    <button
                                                        onClick={(e) => onAddToChatClick(file, e)}
                                                        className={styles.files.actionButton}
                                                        title="Add to chat"
                                                        aria-label="Add to chat"
                                                    >
                                                        <MdLibraryAdd size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDownloadClick(file, e)}
                                                        className={styles.files.actionButton}
                                                        title="Download file"
                                                        aria-label="Download file"
                                                    >
                                                        <FiDownload size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onAnalyzeClick(file, e)}
                                                        className={styles.files.actionButton}
                                                        title="Perform analysis"
                                                        aria-label="Perform analysis"
                                                    >
                                                        <MdAnalytics size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDeleteClick(file, e)}
                                                        className={styles.files.actionButton}
                                                        title="Delete file"
                                                        aria-label="Delete file"
                                                    >
                                                        <MdDelete size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.files.emptyText}>
                                    No uploaded files
                                </p>
                            )}
                        </div>
                    )}

                    {isOpen && activeTab === 'prompts' && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <MdLightbulb className="mr-2" size={20} />
                                    <h3 className={styles.content.section.title}>Saved Prompts</h3>
                                </div>
                                <button
                                    onClick={openCreateModal}
                                    className={styles.content.section.addButton}
                                    title="Create new prompt"
                                    aria-label="Create new prompt"
                                >
                                    <MdAdd size={20} />
                                </button>
                            </div>

                            <PromptsList
                                isDarkMode={isDarkMode}
                                onPromptClick={(prompt) => {
                                    handleSelectPrompt(prompt);
                                    onPromptClick(prompt.content);
                                }}
                                onEditPrompt={openEditModal}
                                onDeletePrompt={(promptId) => {
                                    const promptToDelete = prompts.find(p => p.promptId === promptId);
                                    if (promptToDelete) {
                                        openDeleteModal(promptToDelete);
                                    }
                                }}
                                maxHeight="calc(100vh - 220px)"
                            />
                        </div>
                    )}

                    {isOpen && activeTab === 'settings' && (
                        <div>
                            <div className="flex items-center mb-3">
                                <MdSettings className="mr-2" size={20} />
                                <h3 className="font-semibold text-lg">Settings</h3>
                            </div>
                            <div className="space-y-4">
                                <div className={`p-2 md:p-3 rounded-lg ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'}`}>
                                    <p className="text-sm font-medium mb-2">Theme</p>
                                    <div className="flex items-center">
                                        <button
                                            onClick={toggleTheme}
                                            className={`px-3 py-2 rounded-md flex items-center ${isDarkMode
                                                ? 'dark-active hover:bg-gray-600'
                                                : 'bg-white hover:bg-gray-200 border border-gray-300'
                                                }`}
                                        >
                                            <MdPalette className="mr-2" />
                                            <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-2 md:p-3 rounded-lg ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'}`}>
                                    <p className="text-sm font-medium mb-2">Account</p>
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-full ${isDarkMode ? 'dark-active' : 'bg-white border border-gray-300'} mr-3`}>
                                            <MdAccountCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">User Account</p>
                                            <p className="text-xs text-gray-500">user@example.com</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-2 md:p-3 rounded-lg ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'}`}>
                                    <p className="text-sm font-medium mb-2">Help</p>
                                    <Link
                                        href="/userguide"
                                        className={`flex items-center p-2 rounded-md ${isDarkMode
                                            ? 'dark-active hover:bg-gray-600'
                                            : 'bg-white hover:bg-gray-200 border border-gray-300'
                                            }`}
                                    >
                                        <FiHelpCircle className="mr-2" />
                                        <span>User Guide</span>
                                    </Link>
                                </div>

                                <div className={`p-2 md:p-3 rounded-lg ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'}`}>
                                    <p className="text-sm font-medium mb-2">About</p>
                                    <div className="text-xs text-gray-500">
                                        <p className="mb-1">AseekBot v1.0.0</p>
                                        <p>Data Center Procurement Assistant</p>
                                    </div>
                                </div>
                            </div>
                        </div>
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