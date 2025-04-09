// app/components/prompts/PromptsList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiTag, FiX } from 'react-icons/fi';
import { usePrompts } from '../../hooks/usePrompts';
import { Prompt, PromptType, UploadedFile } from '../../types/shared';
import PromptItem from './PromptItem';
// Dialog is now handled by the ModalContext
import usePromptFileHandler from '../../hooks/usePromptFileHandler';

interface PromptsListProps {
    isDarkMode: boolean;
    onPromptClick?: (prompt: Prompt) => void;
    onEditPrompt?: (prompt: Prompt) => void;
    onDeletePrompt?: (promptId: string) => void;
    onCreatePrompt?: () => void;
    showActions?: boolean;
    maxHeight?: string;
    sessionId?: string;
    chatId?: string;
    userId?: string;
    onStatusUpdate?: (status: string, progress: number) => void;
}

const PromptsList: React.FC<PromptsListProps> = ({
    isDarkMode,
    onPromptClick,
    onEditPrompt,
    onDeletePrompt,
    onCreatePrompt,
    showActions = true,
    maxHeight = '70vh',
    sessionId = '',
    chatId = '',
    userId = 'test-user',
    onStatusUpdate
}) => {
    const {
        prompts,
        isLoading,
        error,
        fetchPrompts,
        filterPromptsByType,
        filterPromptsByTag,
        clearFilters
    } = usePrompts();

    // Use the prompt file handler hook
    const {
        isDialogOpen,
        selectedPrompt,
        requiredFileCount,
        requiredVariables,
        openFileDialog,
        closeFileDialog,
        handleFileSelection
    } = usePromptFileHandler({
        onStatusUpdate,
        sessionId,
        chatId,
        userId
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);
    const [activeFilter, setActiveFilter] = useState<{
        type?: PromptType;
        tag?: string;
    }>({});

    // Apply local search filter
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPrompts(prompts);
            return;
        }

        const searchTermLower = searchTerm.toLowerCase();
        const filtered = prompts.filter(prompt =>
            prompt.title.toLowerCase().includes(searchTermLower) ||
            prompt.description.toLowerCase().includes(searchTermLower) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
        );

        setFilteredPrompts(filtered);
    }, [searchTerm, prompts]);

    // Apply tag filter
    const handleTagFilter = async (tag: string) => {
        setActiveFilter(prev => ({ ...prev, tag }));
        await filterPromptsByTag(tag);
    };

    // Apply type filter
    const handleTypeFilter = async (type: PromptType) => {
        setActiveFilter(prev => ({ ...prev, type }));
        await filterPromptsByType(type);
    };

    // Clear all filters
    const handleClearFilters = async () => {
        setActiveFilter({});
        setSearchTerm('');
        await clearFilters();
    };

    // Handle search input
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    return (
        <div className="flex flex-col w-full">
            {/* Search and filters */}
            <div className={`mb-4 p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <div className="relative mb-2">
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className={`w-full p-2 pl-9 rounded-md transition-colors ${isDarkMode
                                ? 'bg-gray-700 text-white placeholder-gray-400 border-gray-600'
                                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                            } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                    />
                    <FiSearch
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}
                        size={16}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    <button
                        onClick={() => handleTypeFilter('INDIVIDUAL')}
                        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter.type === 'INDIVIDUAL'
                                ? isDarkMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-800'
                                : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        <FiFilter className="mr-1" size={12} />
                        My Prompts
                    </button>

                    <button
                        onClick={() => handleTypeFilter('COMMUNITY')}
                        className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter.type === 'COMMUNITY'
                                ? isDarkMode
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-800'
                                : isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        <FiFilter className="mr-1" size={12} />
                        Community
                    </button>

                    {activeFilter.type || activeFilter.tag || searchTerm ? (
                        <button
                            onClick={handleClearFilters}
                            className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isDarkMode
                                    ? 'bg-red-800 text-white hover:bg-red-700'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                        >
                            <FiX className="mr-1" size={12} />
                            Clear Filters
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Prompts list */}
            <div
                className={`overflow-y-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'
                    }`}
                style={{ maxHeight }}
            >
                {isLoading ? (
                    <div className={`flex justify-center p-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className={`p-4 text-center rounded-lg ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-100 text-red-800'}`}>
                        Error loading prompts: {error.message}
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        No prompts found
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                    >
                        {filteredPrompts.map((prompt) => (
                            <PromptItem
                                key={prompt.promptId}
                                prompt={prompt}
                                isDarkMode={isDarkMode}
                                onClick={() => {
                                    console.log('Prompt clicked:', prompt.title);
                                    // Check if the prompt requires files
                                    if (prompt.content && (
                                        prompt.content.includes('${') || // Has variables
                                        prompt.content.includes('files') || // Mentions files
                                        prompt.promptId.includes('analysis') || // Analysis prompt
                                        prompt.promptId.includes('comparison') // Comparison prompt
                                    )) {
                                        console.log('Prompt requires files or variables, opening dialog');
                                        // Open file selection dialog
                                        openFileDialog(prompt);
                                    } else {
                                        console.log('Regular prompt, calling click handler');
                                        // Regular prompt, just call the click handler
                                        onPromptClick && onPromptClick(prompt);
                                    }
                                }}
                                onEdit={() => onEditPrompt && onEditPrompt(prompt)}
                                onDelete={() => onDeletePrompt && onDeletePrompt(prompt.promptId)}
                                onTagClick={handleTagFilter}
                                showActions={showActions}
                            />
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Create prompt button */}
            {onCreatePrompt && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={onCreatePrompt}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                    >
                        Create New Prompt
                    </button>
                </div>
            )}

            {/* File Selection Dialog is now handled by the ModalContext */}
        </div>
    );
};

export default PromptsList;