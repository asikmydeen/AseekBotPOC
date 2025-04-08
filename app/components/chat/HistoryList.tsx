// app/components/chat/HistoryList.tsx
"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPushed, FaTrash, FaPen, FaEllipsisV, FaClock, FaStar } from 'react-icons/fa';
import { useChatHistory } from '../../hooks/useChatHistory';

interface HistoryItemProps {
    id: string;
    title: string;
    updatedAt: string;
    isPinned: boolean;
    isActive: boolean;
    isDarkMode: boolean;
    onClick: () => void;
    onRename: () => void;
    onDelete: () => void;
    onTogglePin: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({
    id,
    title,
    updatedAt,
    isPinned,
    isActive,
    isDarkMode,
    onClick,
    onRename,
    onDelete,
    onTogglePin
}) => {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <div
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 relative mb-2 ${isActive
                ? isDarkMode
                    ? 'bg-gray-700 border-l-4 border-blue-500'
                    : 'bg-gray-200 border-l-4 border-blue-500'
                : isDarkMode
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
        >
            <div className="flex items-center" onClick={onClick}>
                <div className="flex-shrink-0 mr-3">
                    {isPinned ? (
                        <FaStar className={isDarkMode ? 'text-yellow-400' : 'text-yellow-500'} />
                    ) : (
                        <FaClock className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                    )}
                </div>
                <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <p className="text-xs text-gray-500">
                        {new Date(updatedAt).toLocaleDateString()} {new Date(updatedAt).toLocaleTimeString()}
                    </p>
                </div>
                <button
                    className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowOptions(!showOptions);
                    }}
                >
                    <FaEllipsisV size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </button>
            </div>

            {/* Options Menu */}
            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`absolute right-0 top-full mt-1 z-10 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                            } ring-1 ring-black ring-opacity-5`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <button
                                className={`w-full text-left block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename();
                                    setShowOptions(false);
                                }}
                            >
                                <FaPen className="inline mr-2" /> Rename
                            </button>
                            <button
                                className={`w-full text-left block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePin();
                                    setShowOptions(false);
                                }}
                            >
                                <FaPushed className="inline mr-2" /> {isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                                className={`w-full text-left block px-4 py-2 text-sm ${isDarkMode
                                    ? 'text-red-400 hover:bg-gray-700'
                                    : 'text-red-600 hover:bg-gray-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                    setShowOptions(false);
                                }}
                            >
                                <FaTrash className="inline mr-2" /> Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface RenameDialogProps {
    isOpen: boolean;
    currentTitle: string;
    onClose: () => void;
    onRename: (newTitle: string) => void;
    isDarkMode: boolean;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
    isOpen,
    currentTitle,
    onClose,
    onRename,
    isDarkMode
}) => {
    const [title, setTitle] = useState(currentTitle);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rename Chat
                </h3>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full p-2 mb-4 border rounded-md ${isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                        }`}
                    placeholder="Enter a new title"
                />
                <div className="flex justify-end space-x-3">
                    <button
                        className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md ${!title.trim()
                            ? 'bg-gray-500 cursor-not-allowed'
                            : isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-blue-500 hover:bg-blue-600'
                            } text-white`}
                        disabled={!title.trim()}
                        onClick={() => {
                            if (title.trim()) {
                                onRename(title);
                                onClose();
                            }
                        }}
                    >
                        Rename
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    chatTitle: string;
    onClose: () => void;
    onConfirm: () => void;
    isDarkMode: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
    isOpen,
    chatTitle,
    onClose,
    onConfirm,
    isDarkMode
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                className={`w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}
            >
                <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Delete Chat History
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Are you sure you want to delete "{chatTitle}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                            } text-white`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

interface HistoryListProps {
    isDarkMode: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({ isDarkMode }) => {
    const {
        activeChat,
        loadChat,
        removeChatFromHistory,
        renameChatHistory,
        togglePinChat,
        getPinnedChats,
        getRecentChats
    } = useChatHistory();

    // Get the pinned and recent chats using the getter functions
    const pinnedChats = getPinnedChats ? getPinnedChats() : [];
    const recentChats = getRecentChats ? getRecentChats() : [];

    const [chatToRename, setChatToRename] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [chatToDelete, setChatToDelete] = useState<{
        id: string;
        title: string;
    } | null>(null);

    return (
        <div className="h-full pb-4">
            {/* Pinned Chats Section */}
            {pinnedChats.length > 0 && (
                <div className="mb-4">
                    <h3 className={`font-semibold text-sm mb-2 px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        PINNED CHATS
                    </h3>
                    {pinnedChats.map((chat) => (
                        <HistoryItem
                            key={chat.id}
                            id={chat.id}
                            title={chat.title}
                            updatedAt={chat.updatedAt}
                            isPinned={true}
                            isActive={activeChat.id === chat.id}
                            isDarkMode={isDarkMode}
                            onClick={() => loadChat(chat.id)}
                            onRename={() => setChatToRename({ id: chat.id, title: chat.title })}
                            onDelete={() => setChatToDelete({ id: chat.id, title: chat.title })}
                            onTogglePin={() => togglePinChat(chat.id)}
                        />
                    ))}
                </div>
            )}

            {/* Recent Chats Section */}
            <div>
                <h3 className={`font-semibold text-sm mb-2 px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    RECENT CHATS
                </h3>
                {recentChats.length > 0 ? (
                    recentChats.map((chat) => (
                        <HistoryItem
                            key={chat.id}
                            id={chat.id}
                            title={chat.title}
                            updatedAt={chat.updatedAt}
                            isPinned={false}
                            isActive={activeChat.id === chat.id}
                            isDarkMode={isDarkMode}
                            onClick={() => loadChat(chat.id)}
                            onRename={() => setChatToRename({ id: chat.id, title: chat.title })}
                            onDelete={() => setChatToDelete({ id: chat.id, title: chat.title })}
                            onTogglePin={() => togglePinChat(chat.id)}
                        />
                    ))
                ) : (
                    <p className={`text-sm px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No recent chats
                    </p>
                )}
            </div>

            {/* Rename Dialog */}
            <RenameDialog
                isOpen={chatToRename !== null}
                currentTitle={chatToRename?.title || ''}
                onClose={() => setChatToRename(null)}
                onRename={(newTitle) => {
                    if (chatToRename) {
                        renameChatHistory(chatToRename.id, newTitle);
                        setChatToRename(null);
                    }
                }}
                isDarkMode={isDarkMode}
            />

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmDialog
                isOpen={chatToDelete !== null}
                chatTitle={chatToDelete?.title || ''}
                onClose={() => setChatToDelete(null)}
                onConfirm={() => {
                    if (chatToDelete) {
                        removeChatFromHistory(chatToDelete.id);
                        setChatToDelete(null);
                    }
                }}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default HistoryList;