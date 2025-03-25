// app/components/DocumentAnalysisDisplay.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFileAlt, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';

interface DocumentAnalysisDisplayProps {
    content: string;
    isDarkMode: boolean;
    documentName?: string;
}

const DocumentAnalysisDisplay: React.FC<DocumentAnalysisDisplayProps> = ({
    content,
    isDarkMode,
    documentName = "Document Analysis"
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Parse the markdown content into sections
    const sections: Record<string, string> = {};
    const sectionRegex = /### ([^\n]+)\n((?:.+\n?)+?)(?=### |$)/g;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
        const [, title, content] = match;
        sections[title] = content.trim();
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`mt-4 p-5 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'
                } shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-blue-200'
                }`}
        >
            <div className="flex justify-between items-center mb-3">
                <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className={`text-xl font-bold flex items-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}
                >
                    <FaFileAlt className="mr-2" /> {documentName}
                </motion.h3>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`p-2 rounded-full ${isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </motion.button>
            </div>

            <AnimatePresence mode="wait">
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        {/* Summary Section */}
                        {sections['Summary'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                                    }`}
                            >
                                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                    Summary
                                </h4>
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    {sections['Summary']}
                                </p>
                            </motion.div>
                        )}

                        {/* Key Points Section */}
                        {sections['Key Points'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                                    }`}
                            >
                                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                    Key Points
                                </h4>
                                <div
                                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                                    dangerouslySetInnerHTML={{ __html: sections['Key Points'].replace(/- /g, '• ') }}
                                />
                            </motion.div>
                        )}

                        {/* Recommendations Section */}
                        {sections['Recommendations'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                                    }`}
                            >
                                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                    Recommendations
                                </h4>
                                <div
                                    className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                                    dangerouslySetInnerHTML={{ __html: sections['Recommendations'].replace(/- /g, '• ') }}
                                />
                            </motion.div>
                        )}

                        {/* Next Steps Section */}
                        {sections['Next Steps'] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.4 }}
                                className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                                    }`}
                            >
                                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                    }`}>
                                    Next Steps
                                </h4>
                                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    {sections['Next Steps']}
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DocumentAnalysisDisplay;