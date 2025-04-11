// app/components/chat/HistoryList.tsx
"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPushed, FaTrash, FaPen, FaEllipsisV, FaClock, FaStar } from 'react-icons/fa';
import { useChatHistory } from '../../hooks/useChatHistory';
import { getHistoryListStyles } from '../../styles/chatStyles';

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

    // Get centralized styles
    const styles = getHistoryListStyles(isDarkMode);

    return (
        <div
            className={styles.historyItem.container(isActive, isDarkMode)}
        >
            <div className={styles.historyItem.content} onClick={onClick}>
                <div className="flex-shrink-0 mr-3">
                    {isPinned ? (
                        <FaStar className={styles.historyItem.icon.pinned} />
                    ) : (
                        <FaClock className={styles.historyItem.icon.recent} />
                    )}
                </div>
                <div className="flex-1 truncate">
                    <p className={styles.historyItem.title}>{title}</p>
                    <p className={styles.historyItem.date}>
                        {new Date(updatedAt).toLocaleDateString()} {new Date(updatedAt).toLocaleTimeString()}
                    </p>
                </div>
                <button
                    className={styles.historyItem.optionsButton}
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
                        className={styles.historyItem.optionsMenu.container}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="py-1" role="menu" aria-orientation="vertical">
                            <button
                                className={styles.historyItem.optionsMenu.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename();
                                    setShowOptions(false);
                                }}
                            >
                                <FaPen className="inline mr-2" /> Rename
                            </button>
                            <button
                                className={styles.historyItem.optionsMenu.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePin();
                                    setShowOptions(false);
                                }}
                            >
                                <FaPushed className="inline mr-2" /> {isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                                className={styles.historyItem.optionsMenu.deleteItem}
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

    // Get centralized styles
    const styles = getHistoryListStyles(isDarkMode);

    return (
        <div className={styles.dialog.overlay}>
            <div
                className={styles.dialog.container}
            >
                <h3 className={styles.dialog.title}>
                    Rename Chat
                </h3>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.dialog.input}
                    placeholder="Enter a new title"
                />
                <div className={styles.dialog.buttonContainer}>
                    <button
                        className={styles.dialog.cancelButton}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.dialog.actionButton(!title.trim(), isDarkMode)}
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

    // Get centralized styles
    const styles = getHistoryListStyles(isDarkMode);

    return (
        <div className={styles.dialog.overlay}>
            <div
                className={styles.dialog.container}
            >
                <h3 className={styles.dialog.title}>
                    Delete Chat History
                </h3>
                <p className={styles.dialog.content}>
                    Are you sure you want to delete "{chatTitle}"? This action cannot be undone.
                </p>
                <div className={styles.dialog.buttonContainer}>
                    <button
                        className={styles.dialog.cancelButton}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.dialog.deleteButton}
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

    // Get centralized styles
    const styles = getHistoryListStyles(isDarkMode);

    return (
        <div className={styles.container}>
            {/* Pinned Chats Section */}
            {pinnedChats.length > 0 && (
                <div className="mb-4">
                    <h3 className={styles.sectionTitle}>
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
                <h3 className={styles.sectionTitle}>
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
                    <p className={styles.emptyText}>
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