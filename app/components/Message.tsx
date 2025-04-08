// Enhanced Message.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../utils/apiService';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaDownload,
    FaChevronDown,
    FaChevronUp,
    FaBook,
    FaThumbtack,
    FaRobot,
    FaSpinner,
    FaPaperclip,
    FaFile,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFileCsv,
    FaFileImage,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { MessageType, MultimediaData } from '../types/shared';
import UserThumbnail from './UserThumbnail';
import {
    messageAnimationVariants,
    darkMessageAnimationVariants,
    buttonAnimationVariants,
    getMessageStyles
} from '../styles/messageStyles';

interface MessageProps {
    message: MessageType;
    onMultimediaClick: (content: { type: 'video' | 'graph' | 'image'; data: MultimediaData }) => void;
    onReact: (reaction: 'thumbs-up' | 'thumbs-down') => void;
    onPin: () => void;
    onDownload: () => void;
    isDarkMode: boolean;
    showCitations?: boolean;
    id?: string;
}

function EnhancedMessage({ message, onMultimediaClick, onReact, onPin, isDarkMode, showCitations, id }: MessageProps) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [showCitationPanel, setShowCitationPanel] = useState<boolean>(false);
    const [displayedText, setDisplayedText] = useState<string>('');
    const [isFileCollapsed, setIsFileCollapsed] = useState<boolean>(Boolean(message.attachments && message.attachments.length > 3));
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [showImageConfirmation, setShowImageConfirmation] = useState<boolean>(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<string>('');
    // Get all styles for the message component
    const styles = getMessageStyles(isDarkMode, message.sender);

    // Helper function to get message content with improved priority and logging
    const getMessageContent = useCallback((): string => {
        const content = message.formattedMessage || message.text || message.message || "";
        // Log content for debugging if it's empty or very short
        if (!content || content.length < 5) {
            console.log('Message content issue:', {
                hasFormattedMessage: !!message.formattedMessage,
                hasText: !!message.text,
                hasMessage: !!message.message,
                contentLength: content.length,
                messageId: message.id
            });
        }
        return content;
    }, [message.formattedMessage, message.text, message.message, message.id]);

    // Function to handle image click
    const handleImageClick = (imageUrl: string): void => {
        setCurrentImage(imageUrl);
        setShowImageConfirmation(true);
    };

    // Function to confirm and view full image
    const confirmViewImage = (): void => {
        if (currentImage) {
            onMultimediaClick({ type: 'image', data: { url: currentImage } });
        }
        setShowImageConfirmation(false);
    };

    // Get file icon based on file type
    const getFileIcon = (fileType: string) => {
        if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" size={16} />;
        if (fileType.includes('word') || fileType.includes('docx')) return <FaFileWord className="text-blue-500" size={16} />;
        if (fileType.includes('text') || fileType.includes('txt')) return <FaFile className="text-yellow-500" size={16} />;
        if (fileType.includes('csv')) return <FaFileCsv className="text-green-500" size={16} />;
        if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return <FaFileExcel className="text-green-600" size={16} />;
        if (fileType.includes('image')) return <FaFileImage className="text-purple-500" size={16} />;
        return <FaFile className="text-gray-500" size={16} />;
    };

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Fetch presigned URL for a file
    const fetchPresignedUrl = async (_fileId: string, fileUrl: string) => {
        try {
            const result = await apiService.downloadFile(fileUrl);
            if (result && result.url) {
                return result.url;
            }
            throw new Error('No valid URL in response');
        } catch (error) {
            console.error('Error fetching presigned URL:', error);
            throw error;
        }
    };

    // Strip indentation from multiline strings
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

    // Using animation variants from messageStyles.ts

    useEffect(() => {
        // Get message content regardless of sender
        const messageContent = getMessageContent();

        // Handle empty content case
        if (!messageContent) {
            const errorMessage = message.sender === 'bot'
                ? "Error: No message content available."
                : "";
            setDisplayedText(errorMessage);
            setIsTyping(false);
            setParsedContent(errorMessage ? `<p>${errorMessage}</p>` : "");
            return;
        }

        // Set displayed text immediately for both user and bot
        setDisplayedText(messageContent);
        setIsTyping(false);

        // Configure markdown renderer with enhanced options
        const renderer = new marked.Renderer();

        // Custom image renderer to make images clickable
        renderer.image = ({ href, text }) => {
            return `<div class="image-thumbnail">
                <img src="${href}" alt="${text || 'Image'}" class="thumbnail" data-full-url="${href}" />
                <div class="image-overlay">Click to view</div>
            </div>`;
        };

        // Custom link renderer to open links in new tab
        renderer.link = (link) => {
            const { href, title, text } = link;
            return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        };

        // Custom code renderer to improve code block styling
        renderer.code = (code) => {
            const { text, lang } = code;
            return `<pre class="${lang ? `language-${lang}` : ''}">
                <code class="${lang ? `language-${lang}` : ''}">${text}</code>
            </pre>`;
        };

        // Enhanced marked options
        const options = {
            gfm: true,           // GitHub Flavored Markdown
            breaks: true,       // Convert \n to <br>
            headerIds: true,    // Add IDs to headers
            mangle: false,      // Don't mangle header IDs
            pedantic: false,    // Don't be pedantic
            smartLists: true,   // Use smarter list behavior
            smartypants: true,  // Use smart typography
            renderer,
        };

        try {
            // Parse markdown content
            const content = marked.parse(messageContent, options) as string;

            // Add classes to images and ensure proper styling
            const formattedContent = content
                .replace(/<img /g, '<img class="inline-markdown-image" ')
                .replace(/<table>/g, '<table class="markdown-table">')
                .replace(/<pre>/g, '<pre class="markdown-pre">');

            setParsedContent(formattedContent);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            setParsedContent(`<p>Error rendering content: ${messageContent}</p>`);
        }
    }, [message.text, message.message, message.formattedMessage, message.sender, getMessageContent]);
    // Add event listener for image clicks with improved targeting
    useEffect(() => {
        const handleThumbnailClick = (e: MouseEvent): void => {
            const target = e.target as HTMLElement;

            // Check if the click is within this specific message component
            const messageElement = document.getElementById(id || '');
            if (!messageElement || !messageElement.contains(target)) {
                return; // Click was outside this message component
            }

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

        // Only add the event listener if we have an ID to identify this message
        if (id) {
            document.addEventListener('click', handleThumbnailClick);
            return () => {
                document.removeEventListener('click', handleThumbnailClick);
            };
        }
        return undefined;
    }, [id, handleImageClick]);

    // Render file attachments section
    const renderFileAttachments = () => {
        if (!message.attachments || message.attachments.length === 0) return null;

        const visibleFiles = isFileCollapsed
            ? message.attachments.slice(0, 3)
            : message.attachments;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={styles.attachments.container}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <FaPaperclip className={`mr-2 ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`} />
                        <span className={`text-sm font-medium ${isDarkMode ? 'dark-text' : 'text-gray-700'}`}>
                            {message.attachments.length} Attachment{message.attachments.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    {message.attachments.length > 3 && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFileCollapsed(!isFileCollapsed)}
                            className={`text-xs px-3 py-1 rounded-lg ${isDarkMode ? 'dark-active dark-primary hover:dark-hover' : 'bg-gray-200 text-blue-600 hover:bg-gray-300'} transition-colors`}
                        >
                            {isFileCollapsed ? 'Show All' : 'Collapse'}
                        </motion.button>
                    )}
                </div>

                <AnimatePresence>
                    <motion.div className="space-y-2">
                        {visibleFiles.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                whileHover={{
                                    scale: 1.02,
                                    backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 1)' : 'rgba(255, 255, 255, 1)',
                                    boxShadow: isDarkMode
                                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
                                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
                                }}
                                className={`flex items-center p-3 rounded-lg ${isDarkMode ? 'dark-active hover:dark-hover' : 'bg-white hover:bg-gray-50'
                                    } cursor-pointer transition-all duration-200 shadow-sm`}
                                onClick={async () => {
                                    const fileId = `${file.name}-${file.size}`;

                                    try {
                                        const url = await fetchPresignedUrl(fileId, file.url);
                                        if (typeof url === 'string') {
                                            window.open(url, '_blank');
                                        }
                                    } catch (err) {
                                        console.error('Failed to open file:', err);
                                        // Fallback to original URL if available
                                        file.url && window.open(file.url, '_blank');
                                    }
                                }}                            >
                                {getFileIcon(file.type)}
                                <div className="ml-2 flex-grow min-w-0">
                                    <div className="text-sm font-medium truncate">{file.name}</div>
                                    <div className={`text-xs ${isDarkMode ? 'dark-text' : 'text-gray-500'}`}>
                                        {formatFileSize(file.size)}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <motion.button
                                        whileHover={{ scale: 1.1, color: isDarkMode ? '#3B82F6' : '#2563EB' }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                            }`}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const fileId = `${file.name}-${file.size}`;

                                            try {
                                                const url = await fetchPresignedUrl(fileId, file.url);
                                                if (url && typeof url === 'string') {
                                                    window.open(url, '_blank');
                                                }
                                            } catch (err) {
                                                console.error('Failed to open file:', err);
                                                // Fallback to original URL if available
                                                file.url && window.open(file.url, '_blank');
                                            }
                                        }}                                        aria-label="Open file"
                                        title="Open file"
                                    >
                                        <FaExternalLinkAlt size={14} className={isDarkMode ? 'dark-text' : 'text-gray-500'} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1, color: isDarkMode ? '#3B82F6' : '#2563EB' }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                            }`}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const fileId = `${file.name}-${file.size}`;

                                            try {
                                                const url = await fetchPresignedUrl(fileId, file.url);
                                                if (url && typeof url === 'string') {
                                                    window.open(url, '_blank');
                                                }
                                            } catch (err) {
                                                console.error('Download failed', err);
                                            }
                                        }}                                        aria-label="Download file"
                                        title="Download file"
                                    >
                                        <FaDownload size={14} className={isDarkMode ? 'dark-text' : 'text-gray-500'} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}

                        {isFileCollapsed && message.attachments.length > 3 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 1)' : 'rgba(243, 244, 246, 1)' }}
                                className={`text-center p-2 rounded-lg text-sm ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-white text-gray-500 hover:bg-gray-100'
                                    } cursor-pointer transition-colors shadow-sm`}
                                onClick={() => setIsFileCollapsed(false)}
                            >
                                + {message.attachments.length - 3} more attachment{message.attachments.length - 3 !== 1 ? 's' : ''}
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        );
    };

    // Render report section
    const renderReport = (report: { title: string; content: string; citations?: string[] }) => {
        const renderer = new marked.Renderer();
        const options = {
            gfm: true,
            breaks: true,
            renderer,
        };

        const cleanedContent = stripIndent(report.content);
        const htmlContent = marked.parse(cleanedContent, options) as string;

        const handleDownload = () => {
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
                transition={{ duration: 0.3, delay: 0.2 }}
                className={styles.report.container}
            >
                <div className="flex justify-between items-center mb-3">
                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className={`text-xl font-bold flex items-center ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`}
                    >
                        <FaBook className="mr-2" /> {report.title}
                    </motion.h3>
                    <div className="flex gap-2">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`p-2 rounded-full ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                            aria-label={isCollapsed ? 'Expand report' : 'Collapse report'}
                            aria-expanded={!isCollapsed}
                        >
                            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleDownload}
                            className={`p-2 rounded-full ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                            aria-label="Download report as PDF"
                        >
                            <FaDownload />
                        </motion.button>
                        {report.citations && showCitations && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowCitationPanel(!showCitationPanel)}
                                className={`p-2 rounded-full ${isDarkMode
                                    ? `bg-gray-700 ${showCitationPanel ? 'text-blue-400' : 'text-gray-300'} hover:bg-gray-600`
                                    : `bg-gray-200 ${showCitationPanel ? 'text-blue-600' : 'text-gray-600'} hover:bg-gray-300`
                                    }`}
                                aria-label="Toggle citations"
                                aria-expanded={showCitationPanel}
                                aria-controls="citation-panel"
                            >
                                <FaBook />
                            </motion.button>
                        )}
                    </div>
                </div>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, type: "spring" }}
                            className={styles.content.markdown}
                            dangerouslySetInnerHTML={{ __html: htmlContent }}
                        />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {showCitationPanel && report.citations && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className={styles.citations.container}
                            id="citation-panel"
                            role="region"
                            aria-label="Citations panel"
                        >
                            <h4 className={styles.citations.title}>
                                Citations
                            </h4>
                            <ul className={styles.citations.list}>
                                {report.citations.map((citation, idx) => (
                                    <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: idx * 0.1 }}
                                    >
                                        {citation}
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
                {message.ticket && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className={styles.ticket.container}
                    >
                        <p className={styles.ticket.title}>
                            Ticket Created: {message.ticket.id}
                        </p>
                        <p className={styles.ticket.status}>
                            Status: {message.ticket.status}
                        </p>
                    </motion.div>
                )}
            </motion.div>
        );
    };
    return (
        <div id={id} className={`mb-8 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-start gap-3 ${message.sender === 'user' ? 'flex-row-reverse justify-start' : 'flex-row'}`}>
                {/* Avatar for bot or user */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex-shrink-0 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}
                >
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${message.sender === 'user'
                                ? isDarkMode ? 'dark-active' : 'bg-gray-200'
                                : isDarkMode ? 'dark-info-bg' : 'bg-blue-100'
                            }`}
                    >
                        {message.sender === 'user' ? (
                            <UserThumbnail
                                userId={message.userId || 'test-user'}
                                size={20}
                                className={`${isDarkMode ? 'dark-text' : 'text-gray-600'}`}
                            />
                        ) : (
                            <FaRobot className={`${isDarkMode ? 'dark-primary' : 'text-blue-600'}`} />
                        )}
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={isDarkMode ? darkMessageAnimationVariants : messageAnimationVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    className={`relative p-5 rounded-2xl max-w-[85%] md:max-w-2xl overflow-hidden break-words ${styles.content.container}`}
                >
                    {isTyping ? (
                        <div className={styles.content.typing.container}>
                            <p className={styles.content.typing.text}>
                                {displayedText}
                            </p>
                            <motion.span
                                animate={styles.content.typing.spinner.animation}
                                transition={styles.content.typing.spinner.transition}
                                className={styles.content.typing.spinner.wrapper}
                            >
                                <FaSpinner className={styles.content.typing.spinner.icon} />
                            </motion.span>
                        </div>
                    ) : (
                        <div
                            className={styles.content.markdown}
                            dangerouslySetInnerHTML={{ __html: parsedContent }}
                        />
                    )}

                    {/* Render file attachments */}
                    {!isTyping && message.attachments && message.attachments.length > 0 && renderFileAttachments()}

                    {/* Image Confirmation Dialog */}
                    <AnimatePresence>
                        {showImageConfirmation && currentImage && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={styles.imageDialog.overlay}
                                onClick={() => setShowImageConfirmation(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className={styles.imageDialog.container}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className={styles.imageDialog.title}>
                                        View Image
                                    </h3>
                                    <p className={styles.imageDialog.content}>
                                        Would you like to view this image in full size?
                                    </p>
                                    <div className={styles.imageDialog.buttons}>
                                        <motion.button
                                            variants={buttonAnimationVariants}
                                            initial="idle"
                                            whileHover="hover"
                                            whileTap="tap"
                                            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                } transition-colors shadow-md`}
                                            onClick={() => setShowImageConfirmation(false)}
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            variants={buttonAnimationVariants}
                                            initial="idle"
                                            whileHover="hover"
                                            whileTap="tap"
                                            className={`px-4 py-2 rounded-lg ${isDarkMode ? 'dark-primary-bg text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'
                                                } transition-colors shadow-md`}
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
                                variants={buttonAnimationVariants}
                                initial="idle"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => onMultimediaClick(message.multimedia!)}
                                className={styles.attachments.showMore}
                                aria-label={`View ${message.multimedia.type}`}
                            >
                                <FaExternalLinkAlt className="mr-2" size={14} />
                                View {message.multimedia.type.charAt(0).toUpperCase() + message.multimedia.type.slice(1)}
                            </motion.button>
                        )}

                        {!isTyping && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                className={styles.actions.container}
                            >
                                <motion.button
                                    variants={buttonAnimationVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => onReact('thumbs-up')}
                                    className={`p-2 rounded-full transition-colors ${message.reaction === 'thumbs-up'
                                        ? isDarkMode
                                            ? 'dark-success-bg text-white' // Changed 'dark-success' to 'text-white' for better contrast
                                            : 'bg-green-100 text-green-600'
                                        : isDarkMode
                                            ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                    aria-label="Thumbs up"
                                    aria-pressed={message.reaction === 'thumbs-up'}
                                >
                                    <FaThumbsUp size={16} />
                                </motion.button>

                                <motion.button
                                    variants={buttonAnimationVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => onReact('thumbs-down')}
                                    className={`p-2 rounded-full transition-colors ${message.reaction === 'thumbs-down'
                                        ? isDarkMode
                                            ? 'dark-error-bg text-white' // Changed 'dark-error' to 'text-white' for better contrast
                                            : 'bg-red-100 text-red-600'
                                        : isDarkMode
                                            ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                    aria-label="Thumbs down"
                                    aria-pressed={message.reaction === 'thumbs-down'}
                                >
                                    <FaThumbsDown size={16} />
                                </motion.button>

                                <motion.button
                                    variants={buttonAnimationVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={onPin}
                                    className={`p-2 rounded-full transition-colors ${message.pinned
                                            ? isDarkMode
                                                ? 'dark-primary-bg text-white' // Changed 'dark-primary' to 'text-white' for better contrast
                                                : 'bg-blue-100 text-blue-600'
                                            : isDarkMode
                                                ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                        }`}
                                    aria-label={message.pinned ? 'Unpin message' : 'Pin message'}
                                    aria-pressed={message.pinned}
                                >
                                    <FaThumbtack size={16} />
                                </motion.button>

                                <span className={`text-xs rounded-full px-2 py-1 ${isDarkMode ? 'dark-bg dark-text' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}

// Use React.memo to prevent unnecessary re-renders
export default React.memo(EnhancedMessage, (prevProps, nextProps) => {
    // Custom comparison function to determine if component should re-render
    const prevContent = prevProps.message.formattedMessage || prevProps.message.text || prevProps.message.message;
    const nextContent = nextProps.message.formattedMessage || nextProps.message.text || nextProps.message.message;

    const prevAttachmentsStr = JSON.stringify(prevProps.message.attachments || []);
    const nextAttachmentsStr = JSON.stringify(nextProps.message.attachments || []);

    return (
        prevContent === nextContent &&
        prevProps.message.sender === nextProps.message.sender &&
        prevProps.message.reaction === nextProps.message.reaction &&
        prevProps.message.pinned === nextProps.message.pinned &&
        prevProps.isDarkMode === nextProps.isDarkMode &&
        prevProps.showCitations === nextProps.showCitations &&
        JSON.stringify(prevProps.message.multimedia) === JSON.stringify(nextProps.message.multimedia) &&
        prevAttachmentsStr === nextAttachmentsStr &&
        prevProps.id === nextProps.id &&
        prevProps.message.userId === nextProps.message.userId
    );
});
