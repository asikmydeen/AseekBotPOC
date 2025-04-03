// app/hooks/usePromptsManager.ts
import { useState, useCallback } from 'react';
import { usePrompts } from '../context/PromptsContext';
import {
    Prompt,
    PromptType,
    CreatePromptRequest,
    UpdatePromptRequest
} from '../types/shared';

/**
 * Custom hook for managing prompt operations with loading and error states
 */
export default function usePromptsManager() {
    const {
        prompts,
        isLoading: contextIsLoading,
        error: contextError,
        fetchPrompts,
        getPromptById,
        createPrompt,
        updatePrompt,
        deletePrompt,
        selectedPrompt,
        selectPrompt,
        filterPromptsByType,
        filterPromptsByTag,
        clearFilters
    } = usePrompts();

    // Local loading state for operations
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [operationError, setOperationError] = useState<Error | null>(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [promptToEditOrDelete, setPromptToEditOrDelete] = useState<Prompt | null>(null);

    // Open create modal
    const openCreateModal = useCallback(() => {
        setIsCreateModalOpen(true);
        setOperationError(null);
    }, []);

    // Open edit modal
    const openEditModal = useCallback((prompt: Prompt) => {
        setPromptToEditOrDelete(prompt);
        setIsEditModalOpen(true);
        setOperationError(null);
    }, []);

    // Open delete modal
    const openDeleteModal = useCallback((prompt: Prompt) => {
        setPromptToEditOrDelete(prompt);
        setIsDeleteModalOpen(true);
        setOperationError(null);
    }, []);

    // Close all modals
    const closeAllModals = useCallback(() => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setPromptToEditOrDelete(null);
    }, []);

    // Handle create prompt submission
    const handleCreatePrompt = useCallback(async (promptData: CreatePromptRequest) => {
        setIsSubmitting(true);
        setOperationError(null);

        try {
            const result = await createPrompt(promptData);
            if (result) {
                setIsCreateModalOpen(false);
            }
        } catch (err) {
            setOperationError(err instanceof Error ? err : new Error('Failed to create prompt'));
        } finally {
            setIsSubmitting(false);
        }
    }, [createPrompt]);

    // Handle update prompt submission
    const handleUpdatePrompt = useCallback(async (promptId: string, promptData: UpdatePromptRequest) => {
        setIsSubmitting(true);
        setOperationError(null);

        try {
            const result = await updatePrompt(promptId, promptData);
            if (result) {
                setIsEditModalOpen(false);
                setPromptToEditOrDelete(null);
            }
        } catch (err) {
            setOperationError(err instanceof Error ? err : new Error('Failed to update prompt'));
        } finally {
            setIsSubmitting(false);
        }
    }, [updatePrompt]);

    // Handle delete prompt confirmation
    const handleDeletePrompt = useCallback(async () => {
        if (!promptToEditOrDelete) return;

        setIsDeleting(true);
        setOperationError(null);

        try {
            const success = await deletePrompt(promptToEditOrDelete.promptId);
            if (success) {
                setIsDeleteModalOpen(false);
                setPromptToEditOrDelete(null);
            }
        } catch (err) {
            setOperationError(err instanceof Error ? err : new Error('Failed to delete prompt'));
        } finally {
            setIsDeleting(false);
        }
    }, [deletePrompt, promptToEditOrDelete]);

    // Handle prompt selection
    const handleSelectPrompt = useCallback((prompt: Prompt) => {
        selectPrompt(prompt);
    }, [selectPrompt]);

    return {
        // Data and state
        prompts,
        isLoading: contextIsLoading,
        error: contextError || operationError,
        selectedPrompt,
        isSubmitting,
        isDeleting,

        // Modal states
        isCreateModalOpen,
        isEditModalOpen,
        isDeleteModalOpen,
        promptToEditOrDelete,

        // Modal actions
        openCreateModal,
        openEditModal,
        openDeleteModal,
        closeAllModals,

        // CRUD operations
        handleCreatePrompt,
        handleUpdatePrompt,
        handleDeletePrompt,
        handleSelectPrompt,

        // Filter operations
        fetchPrompts,
        filterPromptsByType,
        filterPromptsByTag,
        clearFilters
    };
}