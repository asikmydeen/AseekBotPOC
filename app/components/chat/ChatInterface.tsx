"use client";
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useTheme } from '../../context/ThemeContext';
import FileActionPrompt from './FileActionPrompt';
import { useEffect, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import FileDropzone from './FileDropzone';
import SuggestionChips from './SuggestionChips';
import TicketForm from './TicketForm';
import FeedbackForm from './FeedbackForm';
import useChatMessages from '../../hooks/useChatMessages';
import useFileUpload from '../../hooks/useFileUpload';
import useTicketSystem from '../../hooks/useTicketSystem';
import useFeedback from '../../hooks/useFeedback';


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
}

export default function ChatInterface({ triggerMessage, onTriggerHandled }: ChatInterfaceProps) {
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
    } = useChatMessages({ triggerMessage, onTriggerHandled });

    // Track the current active agent based on the latest bot message
    const [activeAgent, setActiveAgent] = useState<string>('default');

    const { isUploading, getRootProps, getInputProps, isDragActive, uploadedFiles, removeFile, clearUploadedFiles } = useFileUpload(sendMessage);
    const {
        showTicketForm,
        ticketDetails,
        ticketStep,
        setTicketStep,
        setTicketDetails,
        createTicket,
        closeTicketForm,
        openTicketForm
    } = useTicketSystem(messages);

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
    const {
        showFeedbackForm,
        feedback,
        setFeedback,
        submitFeedback,
        closeFeedbackForm,
        openFeedbackForm
    } = useFeedback();

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
                    exportChatAsPDF={exportChatAsPDF}
                    activeAgentLabel={agentStyle.label}
                    headerClassName={agentStyle.headerClass}
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
                        agentBubbleClass={agentStyle.bubbleClass}
                        agentIconClass={agentStyle.iconClass}
                    />
                </div>
                <div className={`p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} bg-opacity-90 backdrop-filter backdrop-blur-sm`}>
                    <div className="max-w-4xl mx-auto rounded-lg shadow-sm p-2">
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
                        <FileDropzone
                            getRootProps={getRootProps}
                            getInputProps={getInputProps}
                            isUploading={isUploading}
                            isDragActive={isDragActive}
                            isDarkMode={isDarkMode}
                            uploadProgress={progress}
                            fileSizeLimit="10MB"
                            uploadedFiles={uploadedFiles}
                            onRemoveFile={removeFile}
                        />
                        {uploadedFiles.length > 0 && (
                            <FileActionPrompt onAction={handleFileAction} />
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
                            activeAgent={activeAgent}
                        />
                    </div>
                </div>
            </div>
            <MultimediaModal
                isOpen={!!selectedMultimedia}
                onClose={() => setSelectedMultimedia(null)}
                content={selectedMultimedia}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}
