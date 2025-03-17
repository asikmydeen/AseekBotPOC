// app/components/AppSidebar.tsx
"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
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
    MdAdd
} from 'react-icons/md';
import { useTheme } from '../context/ThemeContext';
import { useChatHistory } from '../context/ChatHistoryContext';
import HistoryList from './chat/HistoryList';

interface UploadedFile {
    name: string;
    size: number;
    type: string;
    url?: string;
}

interface AppSidebarProps {
    uploadedFiles: UploadedFile[];
    onFileClick: (fileUrl: string) => void;
    onPromptClick: (prompt: string) => void;
    onToggle?: (isOpen: boolean) => void;
}

export default function AppSidebar({
    uploadedFiles,
    onFileClick,
    onPromptClick,
    onToggle
}: AppSidebarProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    const { createChat } = useChatHistory();

    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>('history');

    const savedPrompts = [
        { title: 'Bid Document Analysis', text: 'Perform bid document analysis for Project Alpha' },
        { title: 'Compare Suppliers', text: 'Compare suppliers for server racks' },
        { title: 'Procurement Process', text: 'Explain the data center procurement process' },
        { title: 'Query Database', text: 'Query the database for Q1 2025 spending' },
        { title: 'Create Ticket', text: 'Create a ticket for network equipment issue' }
    ];

    const sidebarVariants = {
        open: { width: '300px', opacity: 1 },
        closed: { width: '60px', opacity: 1 }
    };

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

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return 'pdf';
        if (fileType.includes('word') || fileType.includes('docx')) return 'docx';
        if (fileType.includes('text') || fileType.includes('txt')) return 'txt';
        if (fileType.includes('csv')) return 'csv';
        if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return 'xlsx';
        if (fileType.includes('image')) return 'img';
        return 'file';
    };

    return (
        <motion.div
            className={`h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden fixed left-0 top-0 z-50`}
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            {/* Sidebar Header */}
            <div className={`h-16 flex items-center justify-between px-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {isOpen && (
                    <div className="flex items-center justify-between w-full">
                        <h2 className="text-xl font-bold flex items-center">
                            <span className="mr-2">AseekBot</span>
                        </h2>
                        <button
                            onClick={handleNewChat}
                            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-800'}`}
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
                <div className={`grid grid-cols-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} p-1`}>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`p-2 rounded-md flex justify-center ${activeTab === 'history' ? (isDarkMode ? 'bg-gray-700' : 'bg-white') : ''}`}
                        aria-label="Chat History"
                        title="Chat History"
                    >
                        <MdHistory size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('files')}
                        className={`p-2 rounded-md flex justify-center ${activeTab === 'files' ? (isDarkMode ? 'bg-gray-700' : 'bg-white') : ''}`}
                        aria-label="Uploaded Files"
                        title="Uploaded Files"
                    >
                        <MdAttachment size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`p-2 rounded-md flex justify-center ${activeTab === 'prompts' ? (isDarkMode ? 'bg-gray-700' : 'bg-white') : ''}`}
                        aria-label="Saved Prompts"
                        title="Saved Prompts"
                    >
                        <MdLightbulb size={20} />
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`p-2 rounded-md flex justify-center ${activeTab === 'settings' ? (isDarkMode ? 'bg-gray-700' : 'bg-white') : ''}`}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <MdSettings size={20} />
                    </button>
                </div>
            )}

            {/* Sidebar Content */}
            <div className="h-[calc(100vh-112px)] overflow-y-auto p-4">
                {isOpen && activeTab === 'history' && (
                    <HistoryList isDarkMode={isDarkMode} />
                )}

                {isOpen && activeTab === 'files' && (
                    <div>
                        <div className="flex items-center mb-3">
                            <MdAttachment className="mr-2" size={20} />
                            <h3 className="font-semibold text-lg">Uploaded Files</h3>
                        </div>
                        {uploadedFiles.length > 0 ? (
                            <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={`file-${index}`}
                                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode
                                            ? 'bg-gray-800 hover:bg-gray-700'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        onClick={() => file.url && onFileClick(file.url)}
                                    >
                                        <div className="flex items-center">
                                            <div className={`mr-3 text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {getFileIcon(file.type) === 'pdf' && '📄'}
                                                {getFileIcon(file.type) === 'docx' && '📝'}
                                                {getFileIcon(file.type) === 'txt' && '📃'}
                                                {getFileIcon(file.type) === 'csv' && '📊'}
                                                {getFileIcon(file.type) === 'xlsx' && '📑'}
                                                {getFileIcon(file.type) === 'img' && '🖼️'}
                                                {getFileIcon(file.type) === 'file' && '📎'}
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
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
                        <div className="flex items-center mb-3">
                            <MdLightbulb className="mr-2" size={20} />
                            <h3 className="font-semibold text-lg">Saved Prompts</h3>
                        </div>
                        <div className="space-y-2">
                            {savedPrompts.map((prompt, index) => (
                                <div
                                    key={`prompt-${index}`}
                                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode
                                        ? 'bg-gray-800 hover:bg-gray-700'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    onClick={() => onPromptClick(prompt.text)}
                                >
                                    <p className="text-sm font-medium">{prompt.title}</p>
                                    <p className="text-xs truncate text-gray-500">{prompt.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isOpen && activeTab === 'settings' && (
                    <div>
                        <div className="flex items-center mb-3">
                            <MdSettings className="mr-2" size={20} />
                            <h3 className="font-semibold text-lg">Settings</h3>
                        </div>
                        <div className="space-y-4">
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <p className="text-sm font-medium mb-2">Theme</p>
                                <div className="flex items-center">
                                    <button
                                        onClick={toggleTheme}
                                        className={`px-3 py-2 rounded-md flex items-center ${isDarkMode
                                            ? 'bg-gray-700 hover:bg-gray-600'
                                            : 'bg-white hover:bg-gray-200 border border-gray-300'
                                            }`}
                                    >
                                        <MdPalette className="mr-2" />
                                        <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                                    </button>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <p className="text-sm font-medium mb-2">Account</p>
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-300'} mr-3`}>
                                        <MdAccountCircle size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">User Account</p>
                                        <p className="text-xs text-gray-500">user@example.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
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

            {/* Collapsed Sidebar */}
            {!isOpen && (
                <div className="flex flex-col items-center pt-4 space-y-6">
                    <button
                        onClick={handleNewChat}
                        className={`p-2 rounded-md ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                        aria-label="New Chat"
                        title="New Chat"
                    >
                        <MdAdd size={24} />
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setIsOpen(true); }}
                        className={`p-2 rounded-md ${activeTab === 'history' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                        aria-label="History"
                        title="History"
                    >
                        <MdHistory size={24} />
                    </button>
                    <button
                        onClick={() => { setActiveTab('files'); setIsOpen(true); }}
                        className={`p-2 rounded-md ${activeTab === 'files' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                        aria-label="Uploaded Files"
                        title="Uploaded Files"
                    >
                        <MdAttachment size={24} />
                    </button>
                    <button
                        onClick={() => { setActiveTab('prompts'); setIsOpen(true); }}
                        className={`p-2 rounded-md ${activeTab === 'prompts' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                        aria-label="Saved Prompts"
                        title="Saved Prompts"
                    >
                        <MdLightbulb size={24} />
                    </button>
                    <button
                        onClick={() => { setActiveTab('settings'); setIsOpen(true); }}
                        className={`p-2 rounded-md ${activeTab === 'settings' ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-200') : ''}`}
                        aria-label="Settings"
                        title="Settings"
                    >
                        <MdSettings size={24} />
                    </button>
                    <div className="grow"></div>
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-md mb-4 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
                        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    >
                        <MdPalette size={24} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}