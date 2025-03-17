// app/components/Message.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { FaThumbsUp, FaThumbsDown, FaDownload, FaChevronDown, FaChevronUp, FaBook, FaThumbtack, FaUser, FaRobot, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface MultimediaData {
    type: 'video' | 'graph' | 'image';
    data: string | Record<string, unknown>;
}

interface MessageType {
    sender: 'user' | 'bot';
    text?: string;
    message?: string;
    multimedia?: MultimediaData;
    report?: { title: string; content: string; citations?: string[] };
    reaction?: 'thumbs-up' | 'thumbs-down';
    timestamp: string;
    ticket?: { id: string; status: string };
    pinned?: boolean;
}

interface Props {
    message: MessageType;
    onMultimediaClick: (content: MultimediaData) => void;
    onReact: (reaction: 'thumbs-up' | 'thumbs-down') => void;
    onPin: () => void;
    isDarkMode: boolean;
    showCitations?: boolean;
}

function Message({ message, onMultimediaClick, onReact, onPin, isDarkMode, showCitations }: Props): JSX.Element {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [showCitationPanel, setShowCitationPanel] = useState<boolean>(false);
    const [displayedText, setDisplayedText] = useState<string>('');

    // Helper function to get message content from either text or message property
    const getMessageContent = useCallback((): string => {
        return message.text || message.message || "";
    }, [message.text, message.message]);
    const [isTyping, setIsTyping] = useState<boolean>(message.sender === 'bot');
    const [showImageConfirmation, setShowImageConfirmation] = useState<boolean>(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<string>('');

    // Optimize typing effect with useRef to avoid recreating interval
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to detect media links in markdown
    const detectMediaLinks = (text: string) => {
        // Currently, no extra processing is needed for media links as marked handles image rendering
        return { modifiedText: text };
    };

    // Function to handle image click
    const handleImageClick = (imageUrl: string): void => {
        setCurrentImage(imageUrl);
        setShowImageConfirmation(true);
    };

    // Function to confirm and view full image
    const confirmViewImage = (): void => {
        if (currentImage) {
            onMultimediaClick({ type: 'image', data: currentImage });
        }
        setShowImageConfirmation(false);
    };

    useEffect(() => {
        if (message.sender === 'bot') {
            // Check if message content exists
            const messageContent = getMessageContent();
            if (!messageContent) {
                // Handle the case when message content is undefined
                setDisplayedText("Error: No message content available.");
                setIsTyping(false);
                setParsedContent("<p>Error: No message content available.</p>");
                return;
            }

            let index = 0;
            // Clear any existing interval
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }

            // Use a faster typing speed (10ms) for better performance
            typingIntervalRef.current = setInterval(() => {
                if (index < messageContent.length) {
                    setDisplayedText(messageContent.slice(0, index + 1));
                    index++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                    }
                    setIsTyping(false);

                    // Parse markdown after typing is complete
                    const renderer = new marked.Renderer();

                    // Customize image rendering to show thumbnails
                    renderer.image = (href: string, title: string, text: string): string => {
                        return `<div class="image-thumbnail">
                            <img src="${href}" alt="${text || 'Image'}" class="thumbnail" data-full-url="${href}" />
                            <div class="image-overlay">Click to view</div>
                        </div>`;
                    };

                    const options = {
                        gfm: true,
                        breaks: true,
                        renderer,
                    };

                    detectMediaLinks(messageContent);
                    const content = marked.parse(messageContent, options) as string;

                    // Add custom class for styling
                    const formattedContent = content.replace(/<img /g, '<img class="inline-markdown-image" ');

                    setParsedContent(formattedContent);

                }
            }, 10);

            return () => {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }
            };
        } else {
            // Check if message content exists for user messages
            const messageContent = getMessageContent();
            if (!messageContent) {
                // Handle the case when message content is undefined
                setDisplayedText("");
                setParsedContent("");
                return;
            }

            setDisplayedText(messageContent);

            // Parse markdown immediately for user messages
            const renderer = new marked.Renderer();

            // Customize image rendering
            renderer.image = (href: string, title: string, text: string): string => {
                return `<div class="image-thumbnail">
                    <img src="${href}" alt="${text || 'Image'}" class="thumbnail" data-full-url="${href}" />
                    <div class="image-overlay">Click to view</div>
                </div>`;
            };

            const options = {
                gfm: true,
                breaks: true,
                renderer,
            };

            detectMediaLinks(messageContent);
            const content = marked.parse(messageContent, options) as string;

            // Add custom class for styling
            const formattedContent = content.replace(/<img /g, '<img class="inline-markdown-image" ');

            setParsedContent(formattedContent);
        }
    }, [message.text, message.message, message.sender, getMessageContent]);

    // Add event listener for image clicks
    useEffect(() => {
        const handleThumbnailClick = (e: MouseEvent): void => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('thumbnail') || target.closest('.image-thumbnail')) {
                const img = target.classList.contains('thumbnail') ? target : target.querySelector('img');
                if (img && img instanceof HTMLImageElement) {
                    const fullUrl = img.getAttribute('data-full-url');
                    if (fullUrl) {
                        e.preventDefault();
                        handleImageClick(fullUrl);
                    }
                }
            }
        };

        document.addEventListener('click', handleThumbnailClick);
        return () => {
            document.removeEventListener('click', handleThumbnailClick);
        };
    }, []);

    const stripIndent = (str: string): string => {
        const lines = str.split('\n');
        const minIndent = lines
            .filter(line => line.trim())
            .reduce((min, line) => {
                const match = line.match(/^\s*/);
                return match ? Math.min(min, match[0].length) : min;
            }, Infinity);
        return lines.map(line => line.slice(minIndent)).join('\n').trim();
    };

    const renderReport = (report: { title: string; content: string; citations?: string[] }): JSX.Element => {
        const renderer = new marked.Renderer();
        const options = {
            gfm: true,
            breaks: true,
            renderer,
        };

        const cleanedContent = stripIndent(report.content);
        const htmlContent = marked.parse(cleanedContent, options) as string;

        const handleDownload = (): void => {
            const element = document.createElement('div');
            element.innerHTML = `
        <h3 style="color: ${isDarkMode ? '#60A5FA' : '#1E40AF'};">${report.title}</h3>
        ${htmlContent}
        ${report.citations ? `<p><strong>Citations:</strong> ${report.citations.join(', ')}</p>` : ''}
      `;
            html2pdf().from(element).set({ filename: `${report.title.replace(/\s+/g, '_')}.pdf` }).save();
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} shadow-md`}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-[#60A5FA]' : 'text-[#1E40AF]'}`}>
                        {report.title}
                    </h3>
                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                            aria-label={isCollapsed ? 'Expand report' : 'Collapse report'}
                            aria-expanded={!isCollapsed}
                            role="button"
                        >
                            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDownload}
                            className={`p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                            aria-label="Download report as PDF"
                        >
                            <FaDownload />
                        </motion.button>
                        {report.citations && showCitations && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowCitationPanel(!showCitationPanel)}
                                className={`p-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                                aria-label="Toggle citations"
                                aria-expanded={showCitationPanel}
                                aria-controls="citation-panel"
                                role="button"
                            >
                                <FaBook />
                            </motion.button>
                        )}
                    </div>
                </div>
                <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`prose max-w-none ${isDarkMode ? 'prose-invert text-gray-200' : 'text-gray-900'}
        prose-headings:${isDarkMode ? 'text-[#60A5FA]' : 'text-[#1E40AF]'}
        prose-p:mt-2 prose-ul:mt-2 prose-ul:pl-5 prose-ul:list-disc
        prose-ol:pl-5 prose-ol:list-decimal
        prose-table:border-collapse prose-table:w-full
        prose-thead:bg-gray-700 prose-th:p-2 prose-th:border prose-th:border-gray-600
        prose-td:border prose-td:border-gray-600 prose-td:p-2
        ${isDarkMode ? 'prose-thead:text-gray-200' : 'prose-thead:text-gray-800'}
        ${isDarkMode ? 'prose-td:border-gray-600' : 'prose-td:border-gray-300'}
    `}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    )}
                </AnimatePresence>                <AnimatePresence>
                    {showCitationPanel && report.citations && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                            id="citation-panel"
                            role="region"
                            aria-label="Citations panel"
                        >
                            <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-[#60A5FA]' : 'text-[#1E40AF]'}`}>
                                Citations
                            </h4>
                            <ul className="list-disc pl-5 text-sm text-gray-300">
                                {report.citations.map((citation, idx) => (
                                    <li key={idx}>{citation}</li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
                {message.ticket && (
                    <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Ticket ID: {message.ticket.id}, Status: {message.ticket.status}
                        </p>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className={`mb-8 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar for bot or user */}
                <div className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user'
                            ? isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                            : isDarkMode ? 'bg-[#1E40AF]' : 'bg-[#60A5FA]'
                    }`}>
                        {message.sender === 'user'
                            ? <FaUser className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                            : <FaRobot className="text-sm text-white" />
                        }
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                    className={`inline-block p-4 rounded-xl max-w-2xl shadow-md hover:shadow-lg ${message.sender === 'user'
                        ? isDarkMode
                            ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-gray-700'
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 border border-gray-200'
                        : isDarkMode
                            ? 'bg-gradient-to-br from-[#1E3A8A] to-[#1E40AF] text-white border border-[#2563EB]'
                            : 'bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] text-white border border-[#93C5FD]'
                        }`}
            >
                {isTyping ? (
                    <div className="flex items-center">
                        <p className="text-base leading-relaxed">
                            {displayedText}
                        </p>
                        <span className="ml-2 animate-spin">
                            <FaSpinner className="text-sm opacity-70" />
                        </span>
                    </div>
                ) : (
                    <div
                        className={`text-base leading-relaxed prose max-w-none ${isDarkMode ? 'prose-invert text-gray-200' : 'text-gray-900'}
                            prose-a:${isDarkMode ? 'text-[#93C5FD]' : 'text-[#1E40AF]'}
                            prose-img:max-w-full prose-img:rounded-md prose-img:my-2
                        `}
                        dangerouslySetInnerHTML={{ __html: parsedContent }}
                    />
                )}

                {/* Image Confirmation Dialog */}
                {showImageConfirmation && currentImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
                        onClick={() => setShowImageConfirmation(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} max-w-lg w-full shadow-xl`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                View Image
                            </h3>
                            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Would you like to view this image?
                            </p>
                            <div className="flex justify-end gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                                    onClick={() => setShowImageConfirmation(false)}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-[#1E40AF] text-white hover:bg-[#2B6CB0]' : 'bg-[#60A5FA] text-white hover:bg-[#93C5FD]'}`}
                                    onClick={confirmViewImage}
                                >
                                    View Image
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
                {message.report && !isTyping && renderReport(message.report)}
                {message.multimedia && !isTyping && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onMultimediaClick(message.multimedia!)}
                        className={`mt-2 text-sm underline ${isDarkMode ? 'text-[#93C5FD] hover:text-white' : 'text-[#1E40AF] hover:text-[#60A5FA]'}`}
                        aria-label={`View ${message.multimedia.type}`}
                    >
                        View {message.multimedia.type === 'video'
                            ? 'Video'
                            : message.multimedia.type === 'graph'
                                ? 'Graph'
                                : 'Image'}
                    </motion.button>
                )}
                {!isTyping && (
                    <div className="flex items-center gap-3 mt-3 justify-end">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onReact('thumbs-up')}
                            className={`text-sm ${message.reaction === 'thumbs-up'
                                ? 'text-yellow-400'
                                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-full p-1.5 transition-colors`}
                            aria-label="Thumbs up"
                            aria-pressed={message.reaction === 'thumbs-up'}
                            role="button"
                        >
                            <FaThumbsUp />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onReact('thumbs-down')}
                            className={`text-sm ${message.reaction === 'thumbs-down'
                                ? 'text-red-400'
                                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            } hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 rounded-full p-1.5 transition-colors`}
                            aria-label="Thumbs down"
                            aria-pressed={message.reaction === 'thumbs-down'}
                            role="button"
                        >
                            <FaThumbsDown />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onPin}
                            className={`text-sm ${message.pinned
                                ? 'text-green-400'
                                : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            } hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 rounded-full p-1.5 transition-colors`}
                            aria-label={message.pinned ? 'Unpin message' : 'Pin message'}
                            aria-pressed={message.pinned}
                            role="button"
                        >
                            <FaThumbtack />
                        </motion.button>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                )}
                </motion.div>
            </div>
        </div>
    );
}

// Use React.memo to prevent unnecessary re-renders
export default React.memo(Message, (prevProps, nextProps): boolean => {
    // Custom comparison function to determine if component should re-render
    // Check both text and message properties
    const prevContent = prevProps.message.text || prevProps.message.message;
    const nextContent = nextProps.message.text || nextProps.message.message;

    return (
        prevContent === nextContent &&
        prevProps.message.sender === nextProps.message.sender &&
        prevProps.message.reaction === nextProps.message.reaction &&
        prevProps.message.pinned === nextProps.message.pinned &&
        prevProps.isDarkMode === nextProps.isDarkMode &&
        prevProps.showCitations === nextProps.showCitations &&
        JSON.stringify(prevProps.message.multimedia) === JSON.stringify(nextProps.message.multimedia)
    );
});
