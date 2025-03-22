// Enhanced Message.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadFileApi } from '../api/advancedApi';
import {
    FaThumbsUp,
    FaThumbsDown,
    FaDownload,
    FaChevronDown,
    FaChevronUp,
    FaBook,
    FaThumbtack,
    FaUser,
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

function EnhancedMessage({ message, onMultimediaClick, onReact, onPin, onDownload, isDarkMode, showCitations, id }: MessageProps) {
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const [showCitationPanel, setShowCitationPanel] = useState<boolean>(false);
    const [displayedText, setDisplayedText] = useState<string>('');
    const [isFileCollapsed, setIsFileCollapsed] = useState<boolean>(Boolean(message.attachments && message.attachments.length > 3));
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [showImageConfirmation, setShowImageConfirmation] = useState<boolean>(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<string>('');
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [previewingFiles, setPreviewingFiles] = useState<Record<string, boolean>>({});
    const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});

    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Helper function to get message content
    const getMessageContent = useCallback((): string => {
        return message.text || message.message || "";
    }, [message.text, message.message]);

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

    // Toggle file preview
    const toggleFilePreview = async (fileId: string, file: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const newPreviewState = !previewingFiles[fileId];

        setPreviewingFiles(prev => ({
            ...prev,
            [fileId]: newPreviewState
        }));

        // If we're opening the preview and don't have a presigned URL yet, fetch it
        if (newPreviewState && !presignedUrls[fileId] && file.url) {
            try {
                await fetchPresignedUrl(fileId, file.url);
            } catch (error) {
                console.error('Failed to fetch presigned URL for preview:', error);
            }
        }
    };

    // Fetch presigned URL for a file
    const fetchPresignedUrl = async (fileId: string, fileUrl: string) => {
        try {
            const result = await downloadFileApi(fileUrl);
            if (result && result.fileUrl) {
                setPresignedUrls(prev => ({
                    ...prev,
                    [fileId]: result.fileUrl || ''
                }));                return result.fileUrl;
            }
        } catch (error) {
            console.error('Error fetching presigned URL:', error);
            throw error;
        }
    };

    // Render file preview based on file type
    const renderFilePreview = (file: any) => {
        if (!file.url) return null;

        const fileId = `${file.name}-${file.size}`;
        const isPreviewOpen = previewingFiles[fileId];

        if (!isPreviewOpen) return null;

        // Use presigned URL if available, otherwise use original URL
        const fileUrl = presignedUrls[fileId] || file.url;

        // If we're showing the preview but don't have a presigned URL yet, fetch it
        if (!presignedUrls[fileId]) {
            fetchPresignedUrl(fileId, file.url)
                .catch(err => console.error('Failed to fetch presigned URL for preview:', err));
        }

        return (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'dark-bg border dark-border' : 'bg-white border border-gray-200'} overflow-hidden`}
            >
                {file.type.includes('pdf') && (
                    <div className="relative h-96 w-full">
                        <iframe
                            src={`${fileUrl}#toolbar=0`}
                            className="w-full h-full rounded border"
                            title={file.name}
                        />
                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`absolute top-2 right-2 p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                        >
                            <FaExternalLinkAlt size={14} />
                        </a>
                    </div>
                )}

                {file.type.includes('image') && (
                    <div className="flex justify-center">
                        <img
                            src={fileUrl}
                            alt={file.name}
                            className="max-h-96 max-w-full object-contain rounded"
                        />
                    </div>
                )}

                {(file.type.includes('text') || file.type.includes('txt')) && (
                    <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} max-h-96 overflow-auto`}>
                        <pre className={`whitespace-pre-wrap break-words text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {/* Text content would be loaded here */}
                            <div className="flex justify-center items-center h-20">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    Preview available in external viewer
                                </span>
                            </div>
                        </pre>
                    </div>
                )}

                {(file.type.includes('excel') || file.type.includes('xlsx') || file.type.includes('xls') || file.type.includes('csv')) && (
                    <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} max-h-96 overflow-auto`}>
                        <div className="flex justify-center items-center h-20">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                Spreadsheet preview available in external viewer
                            </span>
                        </div>
                    </div>
                )}

                {(file.type.includes('word') || file.type.includes('docx')) && (
                    <div className={`p-4 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} max-h-96 overflow-auto`}>
                        <div className="flex justify-center items-center h-20">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                Document preview available in external viewer
                            </span>
                        </div>
                    </div>
                )}

                {!file.type.includes('pdf') &&
                 !file.type.includes('image') &&
                 !file.type.includes('text') &&
                 !file.type.includes('txt') &&
                 !file.type.includes('excel') &&
                 !file.type.includes('xlsx') &&
                 !file.type.includes('xls') &&
                 !file.type.includes('csv') &&
                 !file.type.includes('word') &&
                 !file.type.includes('docx') && (
                    <div className="flex justify-center items-center h-20">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Preview not available for this file type
                        </span>
                    </div>
                )}
            </motion.div>
        );
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

    // Animation variants
    const messageVariants = {
        initial: {
            opacity: 0,
            y: 10,
            scale: 0.98,
            boxShadow: isDarkMode ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: isHovered
                ? isDarkMode
                    ? '0 10px 25px -5px rgba(30, 64, 175, 0.3), 0 8px 10px -6px rgba(30, 64, 175, 0.3)'
                    : '0 10px 25px -5px rgba(59, 130, 246, 0.2), 0 8px 10px -6px rgba(59, 130, 246, 0.1)'
                : isDarkMode
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 1
            }
        },
        hover: {
            scale: 1.01,
            boxShadow: isDarkMode
                ? '0 20px 25px -5px rgba(30, 64, 175, 0.3), 0 8px 10px -6px rgba(30, 64, 175, 0.3)'
                : '0 20px 25px -5px rgba(59, 130, 246, 0.2), 0 8px 10px -6px rgba(59, 130, 246, 0.1)',
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 20
            }
        }
    };

    // Button animation variants
    const buttonVariants = {
        idle: { scale: 1 },
        hover: { scale: 1.1 },
        tap: { scale: 0.9 }
    };

    useEffect(() => {
        if (message.sender === 'bot') {
            const messageContent = getMessageContent();
            if (!messageContent) {
                setDisplayedText("Error: No message content available.");
                setIsTyping(false);
                setParsedContent("<p>Error: No message content available.</p>");
                return;
            }

            // Instead of the typing animation, immediately set the full text
            setDisplayedText(messageContent);
            setIsTyping(false);

            // Process markdown immediately
            const renderer = new marked.Renderer();
            renderer.image = ({ href, title, text }) => {
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

            const content = marked.parse(messageContent, options) as string;
            const formattedContent = content.replace(/<img /g, '<img class="inline-markdown-image" ');
            setParsedContent(formattedContent);
        } else {
            // Keep the user message handling as is
            const messageContent = getMessageContent();
            if (!messageContent) {
                setDisplayedText("");
                setParsedContent("");
                return;
            }

            setDisplayedText(messageContent);

            const renderer = new marked.Renderer();
            renderer.image = ({ href, title, text }) => {
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

            const content = marked.parse(messageContent, options) as string;
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
                className={`mt-3 p-3 rounded-xl ${isDarkMode ? 'dark-card-bg' : 'attachment-bg-light'} shadow-md`}
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
                                        // Use cached presigned URL if available
                                        if (presignedUrls[fileId]) {
                                            window.open(presignedUrls[fileId], '_blank');
                                        } else {
                                            // Otherwise fetch a new one
                                            const url = await fetchPresignedUrl(fileId, file.url);
                                            if (url) {
                                                window.open(url, '_blank');
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Failed to open file:', err);
                                        // Fallback to original URL if available
                                        file.url && window.open(file.url, '_blank');
                                    }
                                }}
                            >
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const fileId = `${file.name}-${file.size}`;
                                            toggleFilePreview(fileId, file, e);
                                        }}
                                        aria-label={previewingFiles[`${file.name}-${file.size}`] ? "Hide preview" : "Preview file"}
                                        title={previewingFiles[`${file.name}-${file.size}`] ? "Hide preview" : "Preview file"}
                                    >
                                        {previewingFiles[`${file.name}-${file.size}`] ? (
                                            <FaChevronUp size={14} className={isDarkMode ? 'text-blue-400' : 'text-blue-500'} />
                                        ) : (
                                            <FaChevronDown size={14} className={isDarkMode ? 'dark-text' : 'text-gray-500'} />
                                        )}
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
                                                // Use cached presigned URL if available
                                                if (presignedUrls[fileId]) {
                                                    window.open(presignedUrls[fileId], '_blank');
                                                } else {
                                                    // Otherwise fetch a new one
                                                    const url = await fetchPresignedUrl(fileId, file.url);
                                                    if (url) {
                                                        window.open(url, '_blank');
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('Failed to open file:', err);
                                                // Fallback to original URL if available
                                                file.url && window.open(file.url, '_blank');
                                            }
                                        }}
                                        aria-label="Open file"
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
                                                // Use cached presigned URL if available
                                                if (presignedUrls[fileId]) {
                                                    window.open(presignedUrls[fileId], '_blank');
                                                } else {
                                                    // Otherwise fetch a new one
                                                    const url = await fetchPresignedUrl(fileId, file.url);
                                                    if (url) {
                                                        window.open(url, '_blank');
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('Download failed', err);
                                            }
                                        }}
                                        aria-label="Download file"
                                        title="Download file"
                                    >
                                        <FaDownload size={14} className={isDarkMode ? 'dark-text' : 'text-gray-500'} />
                                    </motion.button>
                                </div>
                                {renderFilePreview(file)}
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
                className={`mt-4 p-5 rounded-xl ${isDarkMode ? 'dark-bg' : 'bg-gray-100'} shadow-lg border ${isDarkMode ? 'dark-border' : 'border-gray-300'
                    }`}
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
                            className={`prose max-w-none ${isDarkMode ? 'prose-invert dark-text' : 'text-gray-900'
                                } prose-headings:${isDarkMode ? 'dark-primary' : 'text-blue-600'
                                } prose-p:mt-2 prose-ul:mt-2 prose-ul:pl-5 prose-ul:list-disc prose-ol:pl-5 prose-ol:list-decimal
              prose-table:border-collapse prose-table:w-full prose-thead:bg-gray-700 prose-th:p-2 prose-th:border
              prose-th:border-gray-600 prose-td:border prose-td:border-gray-600 prose-td:p-2 ${isDarkMode ? 'prose-thead:text-gray-200' : 'prose-thead:text-gray-800'
                                } ${isDarkMode ? 'prose-td:border-gray-600' : 'prose-td:border-gray-300'}`}
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
                            className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'dark-info-bg border dark-border' : 'bg-blue-50 border border-blue-200'}`}
                            id="citation-panel"
                            role="region"
                            aria-label="Citations panel"
                        >
                            <h4 className={`text-sm font-bold mb-2 ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`}>
                                Citations
                            </h4>
                            <ul className={`list-disc pl-5 text-sm ${isDarkMode ? 'dark-text' : 'text-gray-600'} space-y-1`}>
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
                        className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'dark-success-bg border dark-border' : 'bg-green-50 border border-green-200'
                            }`}
                    >
                        <p className={`text-sm font-medium ${isDarkMode ? 'dark-success' : 'text-green-600'}`}>
                            Ticket Created: {message.ticket.id}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'dark-text' : 'text-gray-500'}`}>
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
                            <FaUser className={`${isDarkMode ? 'dark-text' : 'text-gray-600'}`} />
                        ) : (
                            <FaRobot className={`${isDarkMode ? 'dark-primary' : 'text-blue-600'}`} />
                        )}
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={messageVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    className={`relative p-5 rounded-2xl max-w-[85%] md:max-w-2xl overflow-hidden break-words ${message.sender === 'user'
                            ? isDarkMode
                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 dark-text border dark-border text-left'
                                : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 border border-gray-200 text-left'
                            : isDarkMode
                                ? 'bg-gradient-to-br from-blue-900 to-blue-950 dark-text border dark-border'
                                : 'bg-gradient-to-br from-blue-100 to-blue-200 text-gray-900 border border-blue-300'
                        }`}
                >
                    {isTyping ? (
                        <div className="flex items-center">
                            <p className="text-base leading-relaxed">
                                {displayedText}
                            </p>
                            <motion.span
                                animate={{
                                    rotate: 360
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                className="ml-2"
                            >
                                <FaSpinner className="text-sm opacity-70" />
                            </motion.span>
                        </div>
                    ) : (
                        <div
                            className={`text-base leading-relaxed prose max-w-none break-words overflow-hidden ${isDarkMode ? 'prose-invert dark-text' : 'text-gray-900'
                                } prose-a:${isDarkMode ? 'dark-primary' : 'text-blue-600'
                                } prose-img:max-w-full prose-img:rounded-md prose-img:my-2
              prose-pre:max-w-full prose-pre:overflow-x-auto`}
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
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
                                onClick={() => setShowImageConfirmation(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className={`p-6 rounded-xl ${isDarkMode ? 'dark-bg' : 'bg-white'} max-w-lg w-full shadow-2xl`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'dark-text' : 'text-gray-900'}`}>
                                        View Image
                                    </h3>
                                    <p className={`mb-4 ${isDarkMode ? 'dark-text' : 'text-gray-700'}`}>
                                        Would you like to view this image in full size?
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <motion.button
                                            variants={buttonVariants}
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
                                            variants={buttonVariants}
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
                                variants={buttonVariants}
                                initial="idle"
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => onMultimediaClick(message.multimedia!)}
                                className={`mt-3 px-4 py-2 rounded-lg flex items-center ${isDarkMode
                                        ? 'dark-primary-bg hover:bg-blue-700 text-blue-100'
                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                    } transition-colors shadow-md`}
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
                                className="flex items-center gap-2 mt-4 justify-end"
                            >
                                <motion.button
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => onReact('thumbs-up')}
                                    className={`p-2 rounded-full transition-colors ${message.reaction === 'thumbs-up'
                                            ? isDarkMode
                                                ? 'dark-success-bg dark-success'
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
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={() => onReact('thumbs-down')}
                                    className={`p-2 rounded-full transition-colors ${message.reaction === 'thumbs-down'
                                            ? isDarkMode
                                                ? 'dark-error-bg dark-error'
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
                                    variants={buttonVariants}
                                    initial="idle"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={onPin}
                                    className={`p-2 rounded-full transition-colors ${message.pinned
                                            ? isDarkMode
                                                ? 'dark-primary-bg dark-primary'
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
    const prevContent = prevProps.message.text || prevProps.message.message;
    const nextContent = nextProps.message.text || nextProps.message.message;

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
        prevProps.id === nextProps.id
    );
});
