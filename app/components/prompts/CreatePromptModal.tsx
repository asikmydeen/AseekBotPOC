// app/components/prompts/CreatePromptModal.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatePromptRequest } from '../../types/shared';
import PromptEditor from './PromptEditor';

interface CreatePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (promptData: CreatePromptRequest) => Promise<void>;
    isDarkMode: boolean;
    isSubmitting?: boolean;
}

const CreatePromptModal: React.FC<CreatePromptModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isDarkMode,
    isSubmitting = false
}) => {
    if (!isOpen) return null;

    // Create a typed wrapper function
    const handleSubmit = (data: CreatePromptRequest | UpdatePromptRequest) => {
        // We know this is a create operation, so we can safely cast
        onSubmit(data as CreatePromptRequest);
    };

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
                    className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                    variants={modalVariants}
                    onClick={(e) => e.stopPropagation()}
                >
                    <PromptEditor
                        isDarkMode={isDarkMode}
                        onSubmit={handleSubmit}
                        onCancel={onClose}
                        isSubmitting={isSubmitting}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CreatePromptModal;