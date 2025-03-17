// app/components/chat/ChatInterface.tsx
"use client";
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useTheme } from '../../context/ThemeContext';
import FileActionPrompt from './FileActionPrompt';
import { useEffect, useState, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import SuggestionChips from './SuggestionChips';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import useChatMessages from '../../hooks/useChatMessages';
import useFileUpload from '../../hooks/useFileUpload';
import useTicketSystem from '../../hooks/useTicketSystem';
import useFeedback from '../../hooks/useFeedback';
import FileDropzone from './FileDropzone';

const MultimediaModal = dynamic(() => import('../MultimediaModal'), { ssr: false });

// Define a more specific type for multimedia data
interface MultimediaData {
    url?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    chartData?: Record<string, unknown>;
    videoUrl?: string;
    [key: string]: unknown;
}

export interface MessageType {
    sender: 'user' | 'bot';
    text: string;
    multimedia?: { type: 'video' | 'graph' | 'image'; data: MultimediaData };
    suggestions?: string[];
    report?: { title: string; content: string; citations?: string[] };
    reaction?: 'thumbs-up' | 'thumbs-down';
    timestamp: string;
    ticket?: { id: string; status: string };
    pinned?: boolean;
    triggerTicket?: boolean;
    attachments?: Array<{
        name: string;
        size: number;
        type: string;
        url: string;
    }>;
    id?: string;
    agentType?: 'default' | 'bid-analysis' | 'supplier-search' | 'product-comparison' | 'technical-support';
}

interface ChatInterfaceProps {
    triggerMessage: string | null;
    onTriggerHandled: () => void;
    showDocumentAnalysisPrompt?: boolean;
    clearDocumentAnalysisPrompt?: () => void;
    onMessagesUpdate?: (messages: MessageType[]) => void;
    onFilesUpdate?: (files: any[]) => void;
}

// Changed from forwardRef to regular function component to fix the error
export default function ChatInterface({
    triggerMessage,
    onTriggerHandled,
    showDocumentAnalysisPrompt = false,
    clearDocumentAnalysisPrompt,
    onMessagesUpdate,
    onFilesUpdate
}: ChatInterfaceProps) {
    const { isDarkMode, toggleTheme } = useTheme();
    const {
        messages,
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
        ticketTriggerContext
    } = useChatMessages({
        triggerMessage,
        onTriggerHandled,
        onMessagesUpdate
    });

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
    } = useFileUpload();

    // Sync uploaded files with parent component
    useEffect(() => {
        if (onFilesUpdate) {
            onFilesUpdate(uploadedFiles);
        }
    }, [uploadedFiles, onFilesUpdate]);

    const {
        showTicketForm,
        ticketDetails,
        ticketStep,
        setTicketStep,
        setTicketDetails,
        createTicket,
        closeTicketForm,
        openTicketForm
    } = useTicketSystem();

    // Add debugging logs to track uploaded files
    useEffect(() => {
        console.log("Uploaded files changed:", uploadedFiles);

        // Automatically show file dropzone when files are uploaded
        if (uploadedFiles.length > 0) {
            setShowFileDropzone(true);
        }
    }, [uploadedFiles]);

    // Function to clear all document analysis related state
    const clearDocumentAnalysisState = () => {
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
    };

    // Effect to check for triggerTicket flag in the latest bot message
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

    // Effect to handle document analysis prompt
    useEffect(() => {
        console.log("Document analysis prompt changed:", showDocumentAnalysisPrompt);

        if (showDocumentAnalysisPrompt) {
            // Clear any existing uploaded files when document analysis prompt is shown
            if (uploadedFiles.length > 0) {
                clearUploadedFiles();
            }
            setShowFileDropzone(true);
        } else {
            // When document analysis prompt is cleared and we don't have any uploaded files,
            // also close the file dropzone
            if (uploadedFiles.length === 0) {
                setShowFileDropzone(false);
            }
        }
    }, [showDocumentAnalysisPrompt, uploadedFiles.length, clearUploadedFiles]);

    // Effect that runs whenever triggerMessage changes (which happens when sidebar links are clicked)
    useEffect(() => {
        if (triggerMessage) {
            // If a new message is triggered from sidebar, clear document analysis state
            clearDocumentAnalysisState();
        }
    }, [triggerMessage]);

    const {
        showFeedbackForm,
        feedback,
        setFeedback,
        submitFeedback,
        closeFeedbackForm,
        openFeedbackForm
    } = useFeedback();

    // Get agent-specific styling
    const getAgentStyling = () => {
        switch (activeAgent) {
            case 'bid-analysis':
                return {
                    headerClass: 'bg-purple-700',
                    bubbleClass: 'bg-purple-100 border-purple-300',
                    iconClass: 'text-purple-500',
                    label: 'Bid Analysis Agent'
                };
            case 'supplier-search':
                return {
                    headerClass: 'bg-green-700',
                    bubbleClass: 'bg-green-100 border-green-300',
                    iconClass: 'text-green-500',
                    label: 'Supplier Search Agent'
                };
            case 'product-comparison':
                return {
                    headerClass: 'bg-orange-700',
                    bubbleClass: 'bg-orange-100 border-orange-300',
                    iconClass: 'text-orange-500',
                    label: 'Product Comparison Agent'
                };
            case 'technical-support':
                return {
                    headerClass: 'bg-red-700',
                    bubbleClass: 'bg-red-100 border-red-300',
                    iconClass: 'text-red-500',
                    label: 'Technical Support Agent'
                };
            default:
                return {
                    headerClass: isDarkMode ? 'bg-gray-800' : 'bg-blue-600',
                    bubbleClass: isDarkMode ? 'bg-gray-700' : 'bg-blue-100 border-blue-300',
                    iconClass: isDarkMode ? 'text-gray-300' : 'text-blue-500',
                    label: 'AseekBot Assistant'
                };
        }
    };

    const agentStyle = getAgentStyling();

    // Create a custom suggestion handler that can open the ticket form when needed
    const handleCustomSuggestionClick = (suggestion: string) => {
        // Check if the suggestion text indicates ticket creation
        if (suggestion.toLowerCase().includes('ticket')) {
            // Open the ticket form using the hook's openTicketForm function
            openTicketForm();
        } else {
            // For other suggestions, use the original handleSuggestionClick from useChatMessages
            handleSuggestionClick(suggestion);
        }
    };

    // Handle file action selection from FileActionPrompt
    const handleFileAction = (action: string) => {
        // Log the uploaded files for debugging
        console.debug('Files to be processed:', JSON.stringify(uploadedFiles, null, 2));

        // Ensure files have the required s3Url property
        const validFiles = uploadedFiles.filter(file => file.url);

        if (validFiles.length !== uploadedFiles.length) {
            console.warn('Some files are missing S3 URLs and will be skipped');
        }

        switch (action) {
            case 'bid-analysis':
                // Send message for bid document analysis with attached files
                // Set the useCase to 'bid-analysis' for the Bedrock agent
                const bidAnalysisFiles = validFiles.map(file => ({
                    ...file,
                    useCase: 'bid-analysis' // This will be used by the API to set the proper useCase
                }));

                console.debug('Sending bid analysis files to agent:', JSON.stringify(bidAnalysisFiles, null, 2));
                sendMessage("perform bid document analysis", bidAnalysisFiles);
                clearUploadedFiles();
                // Clear document analysis prompt if it was triggered from sidebar
                if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
                    clearDocumentAnalysisPrompt();
                }
                break;
            case 'document-analysis':
                // Send message for general document analysis with attached files
                const documentAnalysisFiles = validFiles.map(file => ({
                    ...file,
                    useCase: 'document-analysis'
                }));

                console.debug('Sending document analysis files to agent:', JSON.stringify(documentAnalysisFiles, null, 2));
                sendMessage("analyze this document", documentAnalysisFiles);
                clearUploadedFiles();
                // Clear document analysis prompt if it was triggered from sidebar
                if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
                    clearDocumentAnalysisPrompt();
                }
                break;
            case 'send-message':
                // Send message with attached files
                const fileNames = validFiles.map(file => file.name).join(', ');

                // For general file uploads, use the default 'CHAT' useCase
                const chatFiles = validFiles.map(file => ({
                    ...file,
                    useCase: 'CHAT' // This will be used by the API to set the proper useCase
                }));

                console.debug('Sending chat files to agent:', JSON.stringify(chatFiles, null, 2));
                sendMessage(`Uploaded files: ${fileNames}`, chatFiles);
                clearUploadedFiles();
                break;
            case 'cancel':
                // Clear uploaded files without sending a message
                clearUploadedFiles();
                // Also clear the document analysis prompt
                if (showDocumentAnalysisPrompt && clearDocumentAnalysisPrompt) {
                    clearDocumentAnalysisPrompt();
                }
                break;
            default:
                break;
        }
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
                    />
                </div>
                <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-opacity-90 backdrop-filter backdrop-blur-sm`}>
                    <div className="max-w-4xl mx-auto rounded-lg shadow-sm p-2">
                        {/* Document Analysis Modal */}
                        {showDocumentAnalysisPrompt && (
                            <div className={`mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className={`font-medium text-lg ${isDarkMode ? 'text-white' : 'text-blue-700'}`}>
                                        Document Analysis
                                    </h3>
                                    <button
                                        onClick={() => {
                                            if (clearDocumentAnalysisPrompt) {
                                                clearDocumentAnalysisPrompt();
                                                setShowFileDropzone(false);
                                                clearUploadedFiles();
                                            }
                                        }}
                                        className={`p-1 rounded-full ${isDarkMode
                                            ? 'text-gray-300 hover:bg-gray-600'
                                            : 'text-gray-500 hover:bg-gray-200'
                                            }`}
                                        aria-label="Close"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <p className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Upload a document for analysis. I can extract information, summarize content, and answer questions about your document.
                                </p>
                            </div>
                        )}
                        <AnimatePresence>
                            {showTicketForm && (
                                <TicketForm
                                    isDarkMode={isDarkMode}
                                    ticketDetails={ticketDetails}
                                    ticketStep={ticketStep}
                                    setTicketStep={setTicketStep}
                                    setTicketDetails={setTicketDetails}
                                    createTicket={createTicket}
                                    closeTicketForm={closeTicketForm}
                                />
                            )}
                            {showFeedbackForm && (
                                <FeedbackForm
                                    isDarkMode={isDarkMode}
                                    feedback={feedback}
                                    setFeedback={setFeedback}
                                    submitFeedback={submitFeedback}
                                    closeFeedbackForm={closeFeedbackForm}
                                />
                            )}
                        </AnimatePresence>
                        <SuggestionChips
                            suggestions={messages[messages.length - 1]?.suggestions}
                            onSuggestionClick={handleCustomSuggestionClick}
                        />

                        {/* Show file upload components when document analysis is triggered or files are being uploaded */}
                        {(showDocumentAnalysisPrompt || showFileDropzone || uploadedFiles.length > 0) && (
                            <>
                                <div className="mb-2">
                                    <FileDropzone
                                        getRootProps={getRootProps}
                                        getInputProps={getInputProps}
                                        isUploading={isUploading}
                                        isDragActive={isDragActive}
                                        isDarkMode={isDarkMode}
                                        uploadProgress={progress}
                                        fileSizeLimit={10}
                                        uploadedFiles={uploadedFiles}
                                        onRemoveFile={removeFile}
                                        initiallyExpanded={true}
                                    />
                                </div>

                                {uploadedFiles.length > 0 && (
                                    <FileActionPrompt
                                        onAction={handleFileAction}
                                        showDocumentAnalysisOption={showDocumentAnalysisPrompt}
                                    />
                                )}
                            </>
                        )}

                        <ChatInput
                            inputHandler={(input: string) => {
                                // If there are uploaded files, log them for debugging
                                if (uploadedFiles.length > 0) {
                                    console.debug('Sending message with files:',
                                        JSON.stringify(uploadedFiles.map(file => ({
                                            name: file.name,
                                            type: file.type,
                                            size: file.size,
                                            url: file.url
                                        })), null, 2)
                                    );
                                }
                                sendMessage(input, uploadedFiles.length > 0 ? uploadedFiles : undefined);
                            }}
                            isThinking={isThinking}
                            isDarkMode={isDarkMode}
                            onFileUploadToggle={() => setShowFileDropzone(!showFileDropzone)}
                            showFileUpload={showFileDropzone}
                        />
                    </div>
                </div>
            </div>
            <MultimediaModal
                isOpen={!!selectedMultimedia}
                onClose={() => setSelectedMultimedia(null)}
                content={selectedMultimedia}
            />
        </div>
    );
}