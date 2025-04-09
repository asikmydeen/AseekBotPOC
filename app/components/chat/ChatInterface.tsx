// app/components/chat/ChatInterface.tsx
"use client";
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useTheme } from '../../hooks/useTheme';
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
import DocumentAnalysisPrompt from './DocumentAnalysisPrompt';
import FileUploadSection from './FileUploadSection';
import ChatFooter from './ChatFooter';
import useAgentStyling from '../../hooks/useAgentStyling';
import useFileActions from '../../hooks/useFileActions';
import { MessageType, TicketDetails, UploadedFile } from '../../types/shared';
import useMessageArtifacts from '../../hooks/useMessageArtifacts';
import ArtifactPanel from '../ArtifactPanel';

// Dynamically import the multimedia modal to improve initial load time
const MultimediaModal = dynamic(() => import('../MultimediaModal'), { ssr: false });

// Export the component directly - no need for providers anymore
export default function ChatInterface(props: ChatInterfaceProps) {
    // Render the component directly - all state is now managed by Zustand
    return <ChatInterfaceComponent {...props} />;
}

interface ChatInterfaceProps {
    triggerMessage: string | null;
    onTriggerHandled: () => void;
    showDocumentAnalysisPrompt?: boolean;
    clearDocumentAnalysisPrompt?: () => void;
    onMessagesUpdate?: (messages: MessageType[]) => void;
    onFilesUpdate?: (files: any[]) => void;
    initialMessages?: MessageType[];
    externalFileToAdd?: UploadedFile | null;
}

function ChatInterfaceComponent({
    triggerMessage,
    onTriggerHandled,
    showDocumentAnalysisPrompt = false,
    clearDocumentAnalysisPrompt,
    onMessagesUpdate,
    onFilesUpdate,
    initialMessages = [],
    externalFileToAdd = null
}: ChatInterfaceProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    // Using useRef<HTMLTextAreaElement>(null) to match ChatFooter's expected type
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State for tracking user input when files are uploaded
    const [pendingInput, setPendingInput] = useState<string>('');
    const [errorDialogVisible, setErrorDialogVisible] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // State for artifact panel
    const [isArtifactPanelOpen, setIsArtifactPanelOpen] = useState(false);

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
        messagesEndRef: hookMessagesEndRef,
        // New async processing properties
        isAsyncProcessing,
        asyncProgress,
        asyncStatus,
        refreshAsyncStatus,
        cancelAsyncRequest,
        processingError
    } = useChatMessages({
        triggerMessage,
        onTriggerHandled,
        onMessagesUpdate,
        initialMessages
    });

    // Use the message artifacts hook with dependency stabilization
    const { processMessages, processIncomingMessage, artifacts } = useMessageArtifacts();
    const previousMessagesLengthRef = useRef(0);

    // Process initial messages once for artifacts
    useEffect(() => {
        // Only process initial messages if they're available and we haven't processed them yet
        if (initialMessages &&
            initialMessages.length > 0 &&
            previousMessagesLengthRef.current === 0) {
            processMessages(initialMessages);
            previousMessagesLengthRef.current = initialMessages.length;
        }
    }, [initialMessages, processMessages]);

    // Process new messages for artifacts, but only the latest one
    useEffect(() => {
        // Only process if we have more messages than before
        if (messages.length > previousMessagesLengthRef.current) {
            // Get just the latest message
            const latestMessage = messages[messages.length - 1];

            // Only process if it's from the bot
            if (latestMessage && latestMessage.sender === 'bot') {
                processIncomingMessage(latestMessage);
            }

            // Update our count
            previousMessagesLengthRef.current = messages.length;
        }
    }, [messages, processIncomingMessage]);

    // Connect the ref from the hook to our local ref
    useEffect(() => {
        if (hookMessagesEndRef) {
            hookMessagesEndRef.current = messagesEndRef.current;
        }
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

    // Handle processing errors
    useEffect(() => {
        if (processingError) {
            setErrorMessage(processingError.message);
            setErrorDialogVisible(true);
            console.error('Processing error detected:', processingError);

            // Cancel any ongoing async request to prevent infinite loops
            if (isAsyncProcessing) {
                console.log('Cancelling async request due to error');
                cancelAsyncRequest();
            }
        }
    }, [processingError, isAsyncProcessing, cancelAsyncRequest]);

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
        clearUploadedFiles,
        addExternalFile
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
     * Clears all document analysis related state
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

        // Clear the prompt file mode flag
        localStorage.removeItem('inPromptFileMode');
    }, [uploadedFiles.length, clearUploadedFiles, showDocumentAnalysisPrompt, clearDocumentAnalysisPrompt]);

    /**
     * Monitors messages for ticket creation triggers
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

    // Handle external file being added to chat
    useEffect(() => {
        if (externalFileToAdd && addExternalFile) {
            console.log('Adding external file to chat:', externalFileToAdd.name, 'Size:', externalFileToAdd.size);

            // Check if the file object has all required properties before adding
            if (!externalFileToAdd.name || externalFileToAdd.size === undefined) {
                console.error('Invalid external file detected:', externalFileToAdd);
                return;
            }

            // Add the file to the upload state
            addExternalFile(externalFileToAdd);

            // Make sure the file dropzone is visible
            setShowFileDropzone(true);

            // If this is a prompt file, make sure we don't hide the dropzone
            if (externalFileToAdd.isPromptFile) {
                console.log('Prompt file detected, keeping dropzone visible');
                // Store a flag in localStorage to indicate we're in prompt file mode
                localStorage.setItem('inPromptFileMode', 'true');
            }
        }
    }, [externalFileToAdd, addExternalFile, setShowFileDropzone]);

    // Error Dialog handler
    const handleCloseErrorDialog = useCallback(() => {
        setErrorDialogVisible(false);
        setErrorMessage('');
    }, []);

    /**
     * Manages document analysis prompt visibility and file dropzone state
     */
    useEffect(() => {
        if (showDocumentAnalysisPrompt) {
            // Clear any existing uploaded files when document analysis prompt is shown
            if (uploadedFiles.length > 0) {
                clearUploadedFiles();
            }
            setShowFileDropzone(true);
        } else if (uploadedFiles.length === 0) {
            // Check if we're in prompt file mode
            const inPromptFileMode = localStorage.getItem('inPromptFileMode') === 'true';

            if (!inPromptFileMode) {
                // When document analysis prompt is cleared and we don't have any files, hide the dropzone
                setShowFileDropzone(false);
            }
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
     */
    useEffect(() => {
        // Check if we're in prompt file mode
        const inPromptFileMode = localStorage.getItem('inPromptFileMode') === 'true';

        // If we're not thinking (processing a message) and there are no files, hide the dropzone
        if (!isThinking && uploadedFiles.length === 0 && !inPromptFileMode) {
            // Add a small delay to ensure smooth transition
            const timer = setTimeout(() => {
                setShowFileDropzone(false);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isThinking, uploadedFiles.length]);

    /**
     * Custom suggestion handler with ticket creation capability
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

    // Function to manually refresh async status
    const handleRefreshStatus = useCallback(() => {
        if (isAsyncProcessing) {
            refreshAsyncStatus();
        }
    }, [isAsyncProcessing, refreshAsyncStatus]);

    // Toggle artifact panel visibility
    const toggleArtifactPanel = useCallback(() => {
        setIsArtifactPanelOpen(prev => !prev);
    }, []);

    return (
        <div className={`flex-1 flex h-full ${isDarkMode ? 'dark-bg dark-text' : 'bg-gray-50 text-gray-900'} font-sans shadow-lg`}>
            {/* Error Dialog */}
            {errorDialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className={`p-6 rounded-lg shadow-xl max-w-md ${isDarkMode ? 'dark-card-bg dark-text' : 'bg-white text-gray-900'}`}>
                        <h3 className="text-xl font-bold mb-4">Error</h3>
                        <p className="mb-6">{errorMessage || 'An unexpected error occurred. Please try again.'}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={handleCloseErrorDialog}
                                className={`px-4 py-2 rounded-md ${isDarkMode ? 'dark-primary-bg hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content with conditional class for artifact panel */}
            <div
                className={`flex-1 flex flex-col w-full transition-all duration-300 ${isArtifactPanelOpen ? 'mr-[40%]' : 'mr-0'
                    }`}
            >
                <ChatHeader
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    setShowFeedbackForm={openFeedbackForm}
                    setShowTicketForm={openTicketForm}
                    exportChat={exportChatAsPDF}
                    artifactsCount={artifacts.length}
                    onToggleArtifacts={toggleArtifactPanel}
                    isArtifactPanelOpen={isArtifactPanelOpen}
                />

                <div className={`flex-1 overflow-y-auto overscroll-contain p-6 ${isDarkMode ? 'dark-card-bg' : 'bg-gray-50'} rounded-lg shadow-inner mx-2 my-2`}>
                    <MessageList
                        messages={filteredMessages}
                        isThinking={isThinking}
                        progress={progress}
                        isDarkMode={isDarkMode}
                        openMultimedia={openMultimedia}
                        handleReaction={handleReaction}
                        handlePinMessage={handlePinMessage}
                        messagesEndRef={messagesEndRef}
                        // New async props
                        isAsyncProcessing={isAsyncProcessing}
                        asyncProgress={asyncProgress}
                        asyncStatus={asyncStatus}
                        onRefreshStatus={handleRefreshStatus}
                        onCancelRequest={cancelAsyncRequest}
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
                    setTicketDetails={setTicketDetails as React.Dispatch<React.SetStateAction<TicketDetails>>}
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
                    // New async props
                    isAsyncProcessing={isAsyncProcessing}
                    asyncProgress={asyncProgress}
                />
            </div>

            {/* Artifact Panel */}
            <ArtifactPanel
                isOpen={isArtifactPanelOpen}
                onClose={() => setIsArtifactPanelOpen(false)}
                isDarkMode={isDarkMode}
            />

            {/* Multimedia Modal */}
            <MultimediaModal
                isOpen={!!selectedMultimedia}
                onClose={() => setSelectedMultimedia(null)}
                content={selectedMultimedia}
            />
        </div>
    );
}
