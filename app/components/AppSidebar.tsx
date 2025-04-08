// app/components/AppSidebar.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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

    const sidebarVariants = {
        open: {
            transform: 'translateX(0%)',
            width: 'var(--sidebar-width-open, 300px)',
            opacity: 1,
            backgroundColor: isDarkMode ? 'var(--dark-bg-color, #121212)' : 'var(--light-bg, #ffffff)'
        },
        closed: {
            width: 'var(--sidebar-width-closed, 60px)',
            transform: 'translateX(0%)',
            opacity: 1,
            backgroundColor: isDarkMode ? 'var(--dark-bg-color, #121212)' : 'var(--light-bg, #ffffff)'
        }
    };

    const toggleSidebar = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        if (onToggle) {
            onToggle(newIsOpen);
        }
    };

    const sidebarOverlay = isOpen && isMobile ? (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
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
                className={`h-screen ${isDarkMode ? 'dark-bg dark-text' : 'light-bg text-gray-800'} border-r ${isDarkMode ? 'dark-border' : 'border-gray-200'} overflow-hidden fixed left-0 top-0 z-50`}
                initial={false}
                animate={isOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 40,
                    backgroundColor: { duration: 0 }
                }}
                style={{
                    '--sidebar-width-open': 'min(100vw, 300px)',
                    '--sidebar-width-closed': '60px',
                    '--light-bg': '#ffffff'
                } as React.CSSProperties}
            >
                {/* Sidebar Header */}
                <div className={`h-16 flex items-center justify-between px-4 border-b ${isDarkMode ? 'dark-border' : 'border-gray-200'}`}>
                    {isOpen && (
                        <div className="flex items-center justify-between w-full">
                            <h2 className="text-xl font-bold flex items-center">
                                <span className="mr-2">AseekBot</span>
                            </h2>
                            <button
                                onClick={handleNewChat}
                                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 dark-text' : 'hover:bg-gray-100 text-gray-800'}`}
                                aria-label="New Chat"
                                title="New Chat"
                            >
                                <MdAdd size={24} />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
                    >
                        {isOpen ? <MdChevronLeft size={24} /> : <MdChevronRight size={24} />}
                    </button>
                </div>

                {/* Sidebar Tabs */}
                {isOpen && (
                    <div className={`grid grid-cols-4 ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'} p-1`}>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`p-2 rounded-md flex justify-center ${activeTab === 'history' ? (isDarkMode ? 'dark-active' : 'bg-white') : ''}`}
                            aria-label="Chat History"
                            title="Chat History"
                        >
                            <MdHistory size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`p-2 rounded-md flex justify-center ${activeTab === 'files' ? (isDarkMode ? 'dark-active' : 'bg-white') : ''}`}
                            aria-label="Uploaded Files"
                            title="Uploaded Files"
                        >
                            <MdAttachment size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('prompts')}
                            className={`p-2 rounded-md flex justify-center ${activeTab === 'prompts' ? (isDarkMode ? 'dark-active' : 'bg-white') : ''}`}
                            aria-label="Saved Prompts"
                            title="Saved Prompts"
                        >
                            <MdLightbulb size={20} />
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`p-2 rounded-md flex justify-center ${activeTab === 'settings' ? (isDarkMode ? 'dark-active' : 'bg-white') : ''}`}
                            aria-label="Settings"
                            title="Settings"
                        >
                            <MdSettings size={20} />
                        </button>
                    </div>
                )}

                {/* Sidebar Content */}
                <div className="h-[calc(100vh-112px)] overflow-y-auto p-2 sm:p-3 md:p-4">
                    {isOpen && activeTab === 'history' && (
                        <HistoryList isDarkMode={isDarkMode} />
                    )}

                    {isOpen && activeTab === 'files' && (
                        <div>
                            <div className="flex items-center mb-3">
                                <MdAttachment className="mr-2" size={20} />
                                <h3 className="font-semibold text-lg">Uploaded Files</h3>
                            </div>
                            {uploadedFiles && uploadedFiles.length > 0 ? (
                                <div className="space-y-2">
                                    {uploadedFiles.filter(file => file && file.fileName).map((file, index) => (
                                        <div
                                            key={`file-${index}`}
                                            className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${isDarkMode
                                                ? 'dark-card-bg hover:bg-gray-700'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center w-full">
                                                    <span className="mr-2 font-semibold text-sm">{index + 1}.</span>
                                                    <div className={`mr-3 text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {getFileIcon(file.fileType)}
                                                    </div>
                                                    <div className="flex-1 truncate">
                                                        <p className="text-xs font-medium truncate">{file.fileName}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 mt-2 ml-8">
                                                    <button
                                                        onClick={(e) => onAddToChatClick(file, e)}
                                                        className={`p-1.5 rounded-md ${isDarkMode
                                                            ? 'hover:bg-gray-600 text-gray-300'
                                                            : 'hover:bg-gray-300 text-gray-700'}`}
                                                        title="Add to chat"
                                                        aria-label="Add to chat"
                                                    >
                                                        <MdLibraryAdd size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDownloadClick(file, e)}
                                                        className={`p-1.5 rounded-md ${isDarkMode
                                                            ? 'hover:bg-gray-600 text-gray-300'
                                                            : 'hover:bg-gray-300 text-gray-700'}`}
                                                        title="Download file"
                                                        aria-label="Download file"
                                                    >
                                                        <FiDownload size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onAnalyzeClick(file, e)}
                                                        className={`p-1.5 rounded-md ${isDarkMode
                                                            ? 'hover:bg-gray-600 text-gray-300'
                                                            : 'hover:bg-gray-300 text-gray-700'}`}
                                                        title="Perform analysis"
                                                        aria-label="Perform analysis"
                                                    >
                                                        <MdAnalytics size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => onDeleteClick(file, e)}
                                                        className={`p-1.5 rounded-md ${isDarkMode
                                                            ? 'hover:bg-gray-600 text-gray-300'
                                                            : 'hover:bg-gray-300 text-gray-700'}`}
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
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                                    <h3 className="font-semibold text-lg">Saved Prompts</h3>
                                </div>
                                <button
                                    onClick={openCreateModal}
                                    className={`p-1.5 rounded-md ${isDarkMode
                                            ? 'hover:bg-gray-700 text-gray-300'
                                            : 'hover:bg-gray-200 text-gray-700'
                                        }`}
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