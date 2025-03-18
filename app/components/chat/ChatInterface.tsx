// app/components/chat/ChatInterface.tsx
"use client";
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import SuggestionChips from './SuggestionChips';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import useChatMessages from '../../hooks/useChatMessages';
import useFileUpload from '../../hooks/useFileUpload';
import useTicketSystem from '../../hooks/useTicketSystem';
import useFeedback from '../../hooks/useFeedback';
import { ChatProvider, useChatContext } from '../../context/ChatContext';
import DocumentAnalysisPrompt from './DocumentAnalysisPrompt';
import FileUploadSection from './FileUploadSection';
import ChatFooter from './ChatFooter';
import useAgentStyling from '../../hooks/useAgentStyling';
import useFileActions from '../../hooks/useFileActions';
import { MessageType, TicketDetails } from '../../types/shared';

// Dynamically import the multimedia modal to improve initial load time
const MultimediaModal = dynamic(() => import('../MultimediaModal'), { ssr: false });

// Wrap the component with the ChatProvider
export default function ChatInterface(props: ChatInterfaceProps) {
    return (
        <ChatProvider>
            <ChatInterfaceComponent {...props} />
        </ChatProvider>
    );
}

interface ChatInterfaceProps {
    triggerMessage: string | null;
    onTriggerHandled: () => void;
    showDocumentAnalysisPrompt?: boolean;
    clearDocumentAnalysisPrompt?: () => void;
    onMessagesUpdate?: (messages: MessageType[]) => void;
    onFilesUpdate?: (files: any[]) => void;
    initialMessages?: MessageType[];
}

function ChatInterfaceComponent({
    triggerMessage,
    onTriggerHandled,
    showDocumentAnalysisPrompt = false,
    clearDocumentAnalysisPrompt,
    onMessagesUpdate,
    onFilesUpdate,
    initialMessages = []
}: ChatInterfaceProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State for tracking user input when files are uploaded
    const [pendingInput, setPendingInput] = useState<string>('');

    const {
        messages,
        setMessages,
        sendMessage,
        isThinking,
        progress,
        openMultimedia,
        handleReaction,
        handlePinMessage,
        handleSuggestionClick,
        filteredMessages,
        searchQuery,
        setSearchQuery,
        selectedMultimedia,
        setSelectedMultimedia,
        exportChatAsPDF,
        ticketTriggerContext,
        messagesEndRef: hookMessagesEndRef
    } = useChatMessages({
        triggerMessage,
        onTriggerHandled,
        onMessagesUpdate,
        initialMessages
    });

    // Connect the ref from the hook to our local ref
    useEffect(() => {
        hookMessagesEndRef.current = messagesEndRef.current;
    }, [hookMessagesEndRef]);

    // Load initial messages when they change (when switching between chats)
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages, setMessages]);

    // Sync messages with parent component
    useEffect(() => {
        if (onMessagesUpdate) {
            onMessagesUpdate(messages);
        }
    }, [messages, onMessagesUpdate]);

    // Track the current active agent based on the latest bot message
    const [activeAgent, setActiveAgent] = useState<string>('default');

    // Control the visibility of the file dropzone
    const [showFileDropzone, setShowFileDropzone] = useState<boolean>(false);

    const {
        isUploading,
        getRootProps,
        getInputProps,
        isDragActive,
        uploadedFiles,
        removeFile,
        clearUploadedFiles
    } = useFileUpload({
        onFilesUpdate: onFilesUpdate // Pass the callback to sync files with parent
    });

    // Get ticket system functionality
    const {
        showTicketForm,
        ticketDetails: originalTicketDetails,
        ticketStep,
        setTicketStep,
        setTicketDetails,
        createTicket,
        closeTicketForm,
        openTicketForm
    } = useTicketSystem();

    // Ensure ticketDetails conforms to the shared TicketDetails type
    const ticketDetails: TicketDetails = {
        title: originalTicketDetails.title || '',
        description: originalTicketDetails.description || '',
        priority: originalTicketDetails.priority || 'medium',
        category: originalTicketDetails.category || 'general'
    };

    // Ensure scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isThinking]);

    /**
     * Clears all document analysis related state
     * This includes:
     * - Uploaded files
     * - File dropzone visibility
     * - Document analysis prompt
     * - Pending user input
     */
    const clearDocumentAnalysisState = useCallback(() => {
        // Clear any uploaded files
        if (uploadedFiles.length > 0) {
            clearUploadedFiles();
        }

        // Close the file dropzone
        setShowFileDropzone(false);

        // Clear the document analysis prompt if it's open and we have the clear function
        if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
            clearDocumentAnalysisPrompt();
        }

        // Clear any pending input
        setPendingInput('');
    }, [uploadedFiles.length, clearUploadedFiles, showDocumentAnalysisPrompt, clearDocumentAnalysisPrompt]);

    /**
     * Monitors messages for ticket creation triggers
     * When a bot message contains the triggerTicket flag:
     * 1. Opens the ticket form
     * 2. Pre-populates ticket details with context
     * 3. Removes the flag to prevent reopening
     */
    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];

            // Check if the latest message is from the bot and has the triggerTicket flag
            if (latestMessage.sender === 'bot' && latestMessage.triggerTicket) {
                // Open the ticket form with context from ticketTriggerContext
                openTicketForm(ticketTriggerContext || '');

                // Pre-populate the ticket details with the context
                if (ticketTriggerContext) {
                    setTicketDetails(prev => ({
                        ...prev,
                        title: "Assistance needed with: " + ticketTriggerContext.substring(0, 50) +
                            (ticketTriggerContext.length > 50 ? "..." : ""),
                        description: "User query: " + ticketTriggerContext
                    }));
                }

                // Remove the triggerTicket flag to prevent reopening
                latestMessage.triggerTicket = false;
            }
        }
    }, [messages, openTicketForm, setTicketDetails, ticketTriggerContext]);

    // Effect to update active agent based on latest bot message
    useEffect(() => {
        if (messages.length > 0) {
            const latestBotMessage = [...messages].reverse().find(msg => msg.sender === 'bot');
            if (latestBotMessage && latestBotMessage.agentType) {
                setActiveAgent(latestBotMessage.agentType);
            }
        }
    }, [messages]);

    /**
     * Manages document analysis prompt visibility and file dropzone state
     * - Shows file dropzone when document analysis prompt is active
     * - Clears existing files when document analysis prompt is shown
     * - Hides dropzone when prompt is cleared and no files are present
     */
    useEffect(() => {
        if (showDocumentAnalysisPrompt) {
            // Clear any existing uploaded files when document analysis prompt is shown
            if (uploadedFiles.length > 0) {
                clearUploadedFiles();
            }
            setShowFileDropzone(true);
        } else if (uploadedFiles.length === 0) {
            // When document analysis prompt is cleared and we don't have any files, hide the dropzone
            setShowFileDropzone(false);
        }
    }, [showDocumentAnalysisPrompt, uploadedFiles.length, clearUploadedFiles]);

    // Effect that runs whenever triggerMessage changes (sidebar links)
    useEffect(() => {
        if (triggerMessage) {
            // If a new message is triggered from sidebar, clear document analysis state
            clearDocumentAnalysisState();
        }
    }, [triggerMessage, clearDocumentAnalysisState]);

    /**
     * Automatically hides file dropzone after message processing completes
     * - Checks if message processing is complete and no files are present
     * - Uses a small delay for smooth transition
     */
    useEffect(() => {
        // If we're not thinking (processing a message) and there are no files, hide the dropzone
        if (!isThinking && uploadedFiles.length === 0) {
            // Add a small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setShowFileDropzone(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isThinking, uploadedFiles.length]);

    const {
        showFeedbackForm,
        feedback,
        setFeedback,
        submitFeedback,
        closeFeedbackForm,
        openFeedbackForm
    } = useFeedback();

    // Use the custom hook for agent styling
    const agentStyling = useAgentStyling(activeAgent, isDarkMode);

    /**
     * Custom suggestion handler with ticket creation capability
     * - Opens ticket form when suggestion contains "ticket"
     * - Otherwise delegates to the standard suggestion handler
     *
     * @param suggestion - The suggestion text clicked by the user
     */
    const handleCustomSuggestionClick = (suggestion: string) => {
        // Check if the suggestion text indicates ticket creation
        if (suggestion.toLowerCase().includes('ticket')) {
            // Open the ticket form
            openTicketForm();
        } else {
            // For other suggestions, use the original handler
            handleSuggestionClick(suggestion);
        }
    };

    /**
     * Handles user input submission
     * - Sends message with files if files are uploaded
     * - Sends normal message otherwise
     * - Cleans up UI state after sending
     *
     * @param input - The text input from the user
     */
    const handleInputSubmit = (input: string) => {
        if (uploadedFiles.length > 0) {
            // Send message with files
            sendMessage(input, uploadedFiles);

            // Clear uploaded files and hide file dropzone after sending
            setTimeout(() => {
                clearUploadedFiles();
                setShowFileDropzone(false);
            }, 500);
        } else {
            // Normal message without files
            sendMessage(input);
        }

        // Clear any pending input
        setPendingInput('');
    };

    // Use the custom hook for file actions
    const { handleFileAction } = useFileActions({
        inputRef,
        pendingInput,
        uploadedFiles,
        clearUploadedFiles,
        setShowFileDropzone,
        showDocumentAnalysisPrompt,
        clearDocumentAnalysisPrompt,
        setPendingInput,
        sendMessage
    });

    // Toggle file dropzone visibility
    const toggleFileDropzone = useCallback(() => {
        setShowFileDropzone(prev => !prev);
    }, []);

    // Store input when user types while files are loaded
    const handleInputChange = (text: string) => {
        setPendingInput(text);
    };

    return (
        <div className={`flex-1 flex h-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} font-sans shadow-lg`}>
            <div className="flex-1 flex flex-col w-full">
                <ChatHeader
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setShowFeedbackForm={openFeedbackForm}
                    setShowTicketForm={openTicketForm}
                    exportChat={exportChatAsPDF}
                />

                <div className={`flex-1 overflow-y-auto p-6 ${isDarkMode ? 'bg-gray-850' : 'bg-white'} rounded-lg shadow-inner mx-2 my-2`}>
                    <MessageList
                        messages={filteredMessages}
                        isThinking={isThinking}
                        progress={progress}
                        isDarkMode={isDarkMode}
                        openMultimedia={openMultimedia}
                        handleReaction={handleReaction}
                        handlePinMessage={handlePinMessage}
                        messagesEndRef={messagesEndRef}
                    />
                </div>

                <ChatFooter
                    isDarkMode={isDarkMode}
                    showDocumentAnalysisPrompt={showDocumentAnalysisPrompt}
                    clearDocumentAnalysisPrompt={clearDocumentAnalysisPrompt}
                    setShowFileDropzone={setShowFileDropzone}
                    toggleFileDropzone={toggleFileDropzone}
                    clearUploadedFiles={clearUploadedFiles}
                    showTicketForm={showTicketForm}
                    ticketDetails={ticketDetails}
                    ticketStep={ticketStep}
                    setTicketStep={setTicketStep}
                    setTicketDetails={setTicketDetails}
                    createTicket={createTicket}
                    closeTicketForm={closeTicketForm}
                    showFeedbackForm={showFeedbackForm}
                    feedback={feedback}
                    setFeedback={setFeedback}
                    submitFeedback={submitFeedback}
                    closeFeedbackForm={closeFeedbackForm}
                    messages={messages}
                    handleCustomSuggestionClick={handleCustomSuggestionClick}
                    showFileDropzone={showFileDropzone}
                    uploadedFiles={uploadedFiles}
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    isUploading={isUploading}
                    isDragActive={isDragActive}
                    progress={progress}
                    removeFile={removeFile}
                    handleFileAction={handleFileAction}
                    handleInputSubmit={handleInputSubmit}
                    isThinking={isThinking}
                    inputRef={inputRef}
                    handleInputChange={handleInputChange}
                    pendingInput={pendingInput}
                />
            </div>

            {/* Multimedia Modal */}
            <MultimediaModal
                isOpen={!!selectedMultimedia}
                onClose={() => setSelectedMultimedia(null)}
                content={selectedMultimedia}
            />
        </div>
    );
}