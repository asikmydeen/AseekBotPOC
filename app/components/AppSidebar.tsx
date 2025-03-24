// app/components/AppSidebar.tsx
"use client";
import { useState, useEffect } from 'react';
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
    MdAdd
} from 'react-icons/md';
import { FiHelpCircle } from 'react-icons/fi';
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
    const { createChat, activeChat, pinnedChats, recentChats, loadChat } = useChatHistory();
    const [isMobile, setIsMobile] = useState(false);



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

    const savedPrompts = [
        { title: 'Bid Document Analysis', text: 'Perform bid document analysis for Project Alpha' },
        { title: 'Compare Suppliers', text: 'Compare suppliers for server racks' },
        { title: 'Procurement Process', text: 'Explain the data center procurement process' },
        { title: 'Query Database', text: 'Query the database for Q1 2025 spending' },
        { title: 'Create Ticket', text: 'Create a ticket for network equipment issue' }
    ];

    const sidebarVariants = {
        open: { width: 'var(--sidebar-width-open, 300px)', opacity: 1 },
        closed: { width: 'var(--sidebar-width-closed, 60px)', opacity: 1 }
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
        <>
            {sidebarOverlay}
            <motion.div
            className={`h-screen ${isDarkMode ? 'dark-bg dark-text' : 'bg-white text-gray-800'} border-r ${isDarkMode ? 'dark-border' : 'border-gray-200'} overflow-hidden fixed left-0 top-0 z-50
                        ${!isOpen && 'sm:w-16 md:w-16'}
                        ${isOpen && 'sm:w-full md:w-72 lg:w-80'}`}
            initial={false}
            animate={isOpen ? 'open' : 'closed'}
            variants={sidebarVariants}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
                '--sidebar-width-open': 'min(100vw, 300px)',
                '--sidebar-width-closed': '60px'
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
                        {uploadedFiles.length > 0 ? (
                            <div className="space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={`file-${index}`}
                                        className={`p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode
                                            ? 'dark-card-bg hover:bg-gray-700'
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
                                    className={`p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${isDarkMode
                                        ? 'dark-card-bg hover:bg-gray-700'
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

            {/* Collapsed Sidebar */}
            {!isOpen && (
                <div className="flex flex-col items-center pt-4 space-y-4">
                    <button
                        onClick={handleNewChat}
                        className={`p-2 rounded-md ${isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        aria-label="New Chat"
                        title="New Chat"
                    >
                        <MdAdd size={24} />
                    </button>

                    {/* Vertical Quicklinks */}
                    <div className={`w-full px-2 py-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-t border-b`}>
                        <div className="flex flex-col space-y-2">
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex items-center p-2 rounded-md w-full ${activeTab === 'history'
                                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200')}`}
                                aria-label="History"
                                title="History"
                            >
                                <MdHistory size={18} className="mr-2" />
                                <span className="text-xs">History</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={`flex items-center p-2 rounded-md w-full ${activeTab === 'files'
                                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200')}`}
                                aria-label="Uploaded Files"
                                title="Uploaded Files"
                            >
                                <MdAttachment size={18} className="mr-2" />
                                <span className="text-xs">Attachments</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('prompts')}
                                className={`flex items-center p-2 rounded-md w-full ${activeTab === 'prompts'
                                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200')}`}
                                aria-label="Saved Prompts"
                                title="Saved Prompts"
                            >
                                <MdLightbulb size={18} className="mr-2" />
                                <span className="text-xs">Saved Prompts</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex items-center p-2 rounded-md w-full ${activeTab === 'settings'
                                    ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-300')
                                    : (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-200')}`}
                                aria-label="Settings"
                                title="Settings"
                            >
                                <MdSettings size={18} className="mr-2" />
                                <span className="text-xs">Settings</span>
                            </button>
                            <Link
                                href="/userguide"
                                className={`flex items-center p-2 rounded-md w-full ${isDarkMode
                                    ? 'text-gray-300 hover:bg-gray-800'
                                    : 'text-gray-700 hover:bg-gray-200'}`}
                                aria-label="User Guide"
                                title="User Guide"
                            >
                                <FiHelpCircle size={18} className="mr-2" />
                                <span className="text-xs">Help</span>
                            </Link>
                        </div>
                    </div>

                    <div className="grow"></div>

                    {/* Compact view of active tab content */}
                    <div className={`w-full px-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {/* History Tab Compact View */}
                        {activeTab === 'history' && (
                            <div className="flex flex-col">
                                <div className="text-xs py-2 border-t border-b mb-2 mt-2 text-center">
                                    <div className="font-semibold">History</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto px-1">
                                    {pinnedChats && pinnedChats.length > 0 && (
                                        <>
                                            {pinnedChats.map((chat) => (
                                                <div
                                                    key={`pinned-${chat.id}`}
                                                    onClick={() => {
                                                        loadChat(chat.id);
                                                        setIsOpen(true);
                                                        if (onToggle) onToggle(true);
                                                    }}
                                                    className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                                        isDarkMode
                                                            ? 'hover:bg-gray-700'
                                                            : 'hover:bg-gray-200'
                                                    } ${
                                                        activeChat?.id === chat.id
                                                            ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')
                                                            : ''
                                                    }`}
                                                >
                                                    <MdPushPin className="mr-1 text-xs" />
                                                    <span className="text-xs truncate w-full">{chat.title || 'Untitled Chat'}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {recentChats && recentChats.length > 0 && (
                                        <>
                                            {recentChats.slice(0, 5).map((chat) => (
                                                <div
                                                    key={`recent-${chat.id}`}
                                                    onClick={() => {
                                                        loadChat(chat.id);
                                                        setIsOpen(true);
                                                        if (onToggle) onToggle(true);
                                                    }}
                                                    className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                                        isDarkMode
                                                            ? 'hover:bg-gray-700'
                                                            : 'hover:bg-gray-200'
                                                    } ${
                                                        activeChat?.id === chat.id
                                                            ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-200')
                                                            : ''
                                                    }`}
                                                >
                                                    <MdHistory className="mr-1 text-xs" />
                                                    <span className="text-xs truncate w-full">{chat.title || 'Untitled Chat'}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    {(!pinnedChats || pinnedChats.length === 0) &&
                                     (!recentChats || recentChats.length === 0) && (
                                        <div className="text-xs text-center py-2 opacity-70">
                                            No chat history
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Files Tab Compact View */}
                        {activeTab === 'files' && (
                            <div className="flex flex-col">
                                <div className="text-xs py-2 border-t border-b mb-2 mt-2 text-center">
                                    <div className="font-semibold">Files</div>
                                    <div className="text-[10px] opacity-70">{uploadedFiles.length} files</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto px-1">
                                    {uploadedFiles.length > 0 ? (
                                        uploadedFiles.slice(0, 5).map((file, index) => (
                                            <div
                                                key={`compact-file-${index}`}
                                                onClick={() => {
                                                    if (file.url) {
                                                        onFileClick(file.url);
                                                        setIsOpen(true);
                                                        if (onToggle) onToggle(true);
                                                    }
                                                }}
                                                className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                                    isDarkMode
                                                        ? 'hover:bg-gray-700'
                                                        : 'hover:bg-gray-200'
                                                }`}
                                            >
                                                <div className="mr-1 text-sm">
                                                    {getFileIcon(file.type) === 'pdf' && '📄'}
                                                    {getFileIcon(file.type) === 'docx' && '📝'}
                                                    {getFileIcon(file.type) === 'txt' && '📃'}
                                                    {getFileIcon(file.type) === 'csv' && '📊'}
                                                    {getFileIcon(file.type) === 'xlsx' && '📑'}
                                                    {getFileIcon(file.type) === 'img' && '🖼️'}
                                                    {getFileIcon(file.type) === 'file' && '📎'}
                                                </div>
                                                <span className="text-xs truncate w-full">{file.name}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs text-center py-2 opacity-70">
                                            No uploaded files
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Prompts Tab Compact View */}
                        {activeTab === 'prompts' && (
                            <div className="flex flex-col">
                                <div className="text-xs py-2 border-t border-b mb-2 mt-2 text-center">
                                    <div className="font-semibold">Prompts</div>
                                    <div className="text-[10px] opacity-70">{savedPrompts.length} saved</div>
                                </div>
                                <div className="max-h-60 overflow-y-auto px-1">
                                    {savedPrompts.map((prompt, index) => (
                                        <div
                                            key={`compact-prompt-${index}`}
                                            onClick={() => {
                                                onPromptClick(prompt.text);
                                                setIsOpen(true);
                                                if (onToggle) onToggle(true);
                                            }}
                                            className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                                isDarkMode
                                                    ? 'hover:bg-gray-700'
                                                    : 'hover:bg-gray-200'
                                            }`}
                                        >
                                            <MdLightbulb className="mr-1 text-xs" />
                                            <span className="text-xs truncate w-full">{prompt.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settings Tab Compact View */}
                        {activeTab === 'settings' && (
                            <div className="flex flex-col">
                                <div className="text-xs py-2 border-t border-b mb-2 mt-2 text-center">
                                    <div className="font-semibold">Settings</div>
                                </div>
                                <div className="px-1">
                                    <div
                                        onClick={() => {
                                            setIsOpen(true);
                                            if (onToggle) onToggle(true);
                                        }}
                                        className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                            isDarkMode
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-200'
                                        }`}
                                    >
                                        <MdPalette className="mr-1 text-xs" />
                                        <span className="text-xs truncate w-full">Theme</span>
                                    </div>
                                    <div
                                        onClick={() => {
                                            setIsOpen(true);
                                            if (onToggle) onToggle(true);
                                        }}
                                        className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                            isDarkMode
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-200'
                                        }`}
                                    >
                                        <MdAccountCircle className="mr-1 text-xs" />
                                        <span className="text-xs truncate w-full">Account</span>
                                    </div>
                                    <Link
                                        href="/userguide"
                                        className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${
                                            isDarkMode
                                                ? 'hover:bg-gray-700'
                                                : 'hover:bg-gray-200'
                                        }`}
                                    >
                                        <FiHelpCircle className="mr-1 text-xs" />
                                        <span className="text-xs truncate w-full">Help</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-md mb-4 ${isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                            : 'bg-gray-200 hover:bg-gray-300 border border-gray-300'}`}
                        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    >
                        <MdPalette size={24} />
                    </button>
                </div>
            )}
            </motion.div>
        </>
    );
}
