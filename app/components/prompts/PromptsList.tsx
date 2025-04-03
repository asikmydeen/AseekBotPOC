// app/components/prompts/PromptItem.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiTag, FiEdit, FiTrash, FiMoreVertical, FiUser, FiUsers } from 'react-icons/fi';
import { Prompt } from '../../types/shared';

interface PromptItemProps {
    prompt: Prompt;
    isDarkMode: boolean;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onTagClick?: (tag: string) => void;
    showActions?: boolean;
}

const PromptItem: React.FC<PromptItemProps> = ({
    prompt,
    isDarkMode,
    onClick,
    onEdit,
    onDelete,
    onTagClick,
    showActions = true
}) => {
    const [showOptions, setShowOptions] = useState(false);

    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        setShowOptions(false);
        action();
    };

    // Format creation date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={`p-3 rounded-lg cursor-pointer transition-colors relative ${isDarkMode
                ? 'bg-gray-750 hover:bg-gray-700'
                : 'bg-white hover:bg-gray-50 shadow-sm'
                }`}
        >
            <div className="flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                        <h3 className={`font-medium text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {prompt.title}
                        </h3>
                        <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {prompt.description}
                        </p>
                    </div>

                    {showActions && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptions(!showOptions);
                                }}
                                className={`p-1.5 rounded-full ${isDarkMode
                                    ? 'hover:bg-gray-600 text-gray-400'
                                    : 'hover:bg-gray-200 text-gray-600'
                                    }`}
                            >
                                <FiMoreVertical size={16} />
                            </button>

                            {showOptions && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`absolute right-0 top-full mt-1 z-10 w-32 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                                        } ring-1 ring-black ring-opacity-5`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="py-1" role="menu">
                                        {onEdit && (
                                            <button
                                                onClick={(e) => handleActionClick(e, onEdit)}
                                                className={`w-full text-left flex items-center px-4 py-2 text-sm ${isDarkMode
                                                    ? 'text-gray-300 hover:bg-gray-700'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <FiEdit className="mr-2" size={14} />
                                                Edit
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                onClick={(e) => handleActionClick(e, onDelete)}
                                                className={`w-full text-left flex items-center px-4 py-2 text-sm ${isDarkMode
                                                    ? 'text-red-400 hover:bg-gray-700'
                                                    : 'text-red-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <FiTrash className="mr-2" size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                    {prompt.type === 'INDIVIDUAL' ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                            <FiUser size={10} className="mr-1" />
                            Personal
                        </span>
                    ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            }`}>
                            <FiUsers size={10} className="mr-1" />
                            Community
                        </span>
                    )}

                    {prompt.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTagClick && onTagClick(tag);
                            }}
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs cursor-pointer ${isDarkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <FiTag size={10} className="mr-1" />
                            {tag}
                        </span>
                    ))}

                    {prompt.tags.length > 3 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                            +{prompt.tags.length - 3} more
                        </span>
                    )}
                </div>

                <div className="flex justify-between items-center mt-2 text-xs">
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Created: {formatDate(prompt.createdAt)}
                    </span>

                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Variables: {prompt.variables.length}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default PromptItem;