// app/components/prompts/DeletePromptConfirmation.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeletePromptConfirmationProps {
    isOpen: boolean;
    promptTitle: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    isDarkMode: boolean;
    isDeleting?: boolean;
}

const DeletePromptConfirmation: React.FC<DeletePromptConfirmationProps> = ({
    isOpen,
    promptTitle,
    onClose,
    onConfirm,
    isDarkMode,
    isDeleting = false
}) => {
    if (!isOpen) return null;

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: { opacity: 1, scale: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={backdropVariants}
            >
                <motion.div
                    className={`w-full max-w-md rounded-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                        }`}
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center mb-4">
                        <FiAlertTriangle
                            className="text-red-500 mr-3"
                            size={24}
                        />
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Delete Prompt
                        </h3>
                    </div>

                    <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Are you sure you want to delete the prompt <span className="font-semibold">"{promptTitle}"</span>? This action cannot be undone.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 rounded-md transition-colors ${isDarkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                }`}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-md transition-colors flex items-center ${isDarkMode
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                } ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Prompt'
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DeletePromptConfirmation;