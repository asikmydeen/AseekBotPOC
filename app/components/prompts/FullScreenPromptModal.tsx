// app/components/prompts/FullScreenPromptModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt, CreatePromptRequest, UpdatePromptRequest } from '../../types/shared';
import PromptEditor from './PromptEditor';

interface FullScreenPromptModalProps {
    isOpen: boolean;
    prompt?: Prompt | null;
    onClose: () => void;
    onSubmit: (promptData: CreatePromptRequest | UpdatePromptRequest, promptId?: string) => Promise<void>;
    isDarkMode: boolean;
    isSubmitting?: boolean;
    isCreateMode?: boolean;
}

const FullScreenPromptModal: React.FC<FullScreenPromptModalProps> = ({
    isOpen,
    prompt,
    onClose,
    onSubmit,
    isDarkMode,
    isSubmitting = false,
    isCreateMode = false
}) => {
    if (!isOpen) return null;

    // Create a typed wrapper function
    const handleSubmit = (data: CreatePromptRequest | UpdatePromptRequest) => {
        if (isCreateMode) {
            // Create operation
            onSubmit(data as CreatePromptRequest);
        } else if (prompt) {
            // Update operation
            onSubmit(data as UpdatePromptRequest, prompt.promptId);
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };

    const modalVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={backdropVariants}
            >
                <motion.div
                    className="w-full max-w-5xl max-h-[90vh] m-4 overflow-hidden flex flex-col"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={`rounded-lg shadow-xl overflow-hidden flex flex-col h-full ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex justify-between items-center`}>
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {isCreateMode ? 'Create New Prompt' : 'Edit Prompt'}
                            </h2>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-full hover:bg-opacity-20 ${
                                    isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-700'
                                }`}
                                aria-label="Close"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6">
                            <PromptEditor
                                isDarkMode={isDarkMode}
                                prompt={prompt || undefined}
                                onSubmit={handleSubmit}
                                onCancel={onClose}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default FullScreenPromptModal;
