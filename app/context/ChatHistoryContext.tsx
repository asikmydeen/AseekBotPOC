// app/context/ChatHistoryContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { MessageType } from '../components/chat/ChatInterface';
import {
    ChatHistoryEntry,
    createNewChat,
    getChatHistory,
    saveChat,
    deleteChat,
    renameChat,
    toggleChatPinned,
    getChatById
} from '../utils/chatHistoryManager';

interface ChatHistoryContextProps {
    activeChat: ChatHistoryEntry;
    setActiveChat: (chat: ChatHistoryEntry) => void;
    chatHistory: ChatHistoryEntry[];
    pinnedChats: ChatHistoryEntry[];
    recentChats: ChatHistoryEntry[];
    createChat: () => void;
    loadChat: (chatId: string) => void;
    updateChatMessages: (messages: MessageType[]) => void;
    removeChatFromHistory: (chatId: string) => void;
    renameChatHistory: (chatId: string, newTitle: string) => void;
    togglePinChat: (chatId: string) => void;
    isChatLoading: boolean;
}

const defaultChat: ChatHistoryEntry = {
    id: 'default-chat',
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false
};

const ChatHistoryContext = createContext<ChatHistoryContextProps | undefined>(undefined);

export const ChatHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeChat, setActiveChat] = useState<ChatHistoryEntry>(defaultChat);
    const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Use ref to track if we're in the middle of an update
    const isUpdating = useRef(false);
    // Use ref to track last messages to prevent unnecessary updates
    const lastMessages = useRef<string>('');

    // Load chat history from local storage on initial load
    useEffect(() => {
        try {
            const history = getChatHistory();
            if (history.length === 0) {
                // If no history exists, create a new chat
                const newChat = createNewChat();
                saveChat(newChat);
                setChatHistory([newChat]);
                setActiveChat(newChat);
            } else {
                setChatHistory(history);
                // Set the most recent chat as active
                const mostRecent = [...history].sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )[0];
                setActiveChat(mostRecent);
            }
        } catch (error) {
            console.error("Failed to load chat history:", error);
            // Fallback to a new chat
            const newChat = createNewChat();
            setChatHistory([newChat]);
            setActiveChat(newChat);
        }
    }, []);

    // Create a new chat session
    const createChat = useCallback(() => {
        const newChat = createNewChat();
        setActiveChat(newChat);
        setChatHistory(prev => [newChat, ...prev]);
        saveChat(newChat);
    }, []);

    // Load a chat session by ID
    const loadChat = useCallback((chatId: string) => {
        setIsChatLoading(true);
        try {
            const chat = getChatById(chatId);
            if (chat) {
                setActiveChat(chat);
                // Reset last messages when loading a new chat
                lastMessages.current = JSON.stringify(chat.messages);
            }
        } catch (error) {
            console.error("Failed to load chat:", error);
        } finally {
            setIsChatLoading(false);
        }
    }, []);

    // Update messages for active chat and save it
    const updateChatMessages = useCallback((messages: MessageType[]) => {
        if (!activeChat || !messages || isUpdating.current) return;

        // Check if messages have actually changed to avoid unnecessary updates
        const messagesString = JSON.stringify(messages);
        if (messagesString === lastMessages.current) {
            return;
        }

        // Set updating flag to prevent re-renders
        isUpdating.current = true;

        try {
            const updatedChat = {
                ...activeChat,
                messages,
                updatedAt: new Date().toISOString()
            };

            // Update last messages ref
            lastMessages.current = messagesString;

            // Update active chat state
            setActiveChat(updatedChat);

            // Save to localStorage
            saveChat(updatedChat);

            // Update chat history list
            setChatHistory(prev => {
                const index = prev.findIndex(chat => chat.id === activeChat.id);
                if (index >= 0) {
                    const updated = [...prev];
                    updated[index] = updatedChat;
                    return updated;
                }
                return [updatedChat, ...prev];
            });
        } catch (error) {
            console.error("Failed to update chat messages:", error);
        } finally {
            // Reset updating flag
            isUpdating.current = false;
        }
    }, [activeChat]);

    const removeChatFromHistory = useCallback((chatId: string) => {
        deleteChat(chatId);
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));

        // If active chat is deleted, set a new active chat
        if (activeChat.id === chatId) {
            const remainingChats = chatHistory.filter(chat => chat.id !== chatId);
            if (remainingChats.length > 0) {
                // Set the most recent chat as active
                const mostRecent = [...remainingChats].sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                )[0];
                setActiveChat(mostRecent);
            } else {
                // If no chats left, create a new one
                const newChat = createNewChat();
                saveChat(newChat);
                setChatHistory([newChat]);
                setActiveChat(newChat);
            }
        }
    }, [activeChat, chatHistory, createChat]);

    // Rename a chat in history
    const renameChatHistory = useCallback((chatId: string, newTitle: string) => {
        renameChat(chatId, newTitle);
        setChatHistory(prev =>
            prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, title: newTitle, updatedAt: new Date().toISOString() }
                    : chat
            )
        );

        // Update active chat if it's the one being renamed
        if (activeChat.id === chatId) {
            setActiveChat(prev => ({ ...prev, title: newTitle }));
        }
    }, [activeChat]);

    // Toggle pinned status of a chat
    const togglePinChat = useCallback((chatId: string) => {
        toggleChatPinned(chatId);
        setChatHistory(prev => {
            return prev.map(chat =>
                chat.id === chatId
                    ? { ...chat, pinned: !chat.pinned, updatedAt: new Date().toISOString() }
                    : chat
            );
        });

        // Update active chat if it's the one being toggled
        if (activeChat.id === chatId) {
            setActiveChat(prev => ({ ...prev, pinned: !prev.pinned }));
        }
    }, [activeChat]);

    // Filtered lists for UI
    const pinnedChats = chatHistory.filter(chat => chat.pinned);
    const recentChats = chatHistory
        .filter(chat => !chat.pinned)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
        <ChatHistoryContext.Provider
            value={{
                activeChat,
                setActiveChat,
                chatHistory,
                pinnedChats,
                recentChats,
                createChat,
                loadChat,
                updateChatMessages,
                removeChatFromHistory,
                renameChatHistory,
                togglePinChat,
                isChatLoading
            }}
        >
            {children}
        </ChatHistoryContext.Provider>
    );
};

export const useChatHistory = () => {
    const context = useContext(ChatHistoryContext);
    if (context === undefined) {
        throw new Error('useChatHistory must be used within a ChatHistoryProvider');
    }
    return context;
};