// app/context/PromptsContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    getPromptsApi,
    getPromptByIdApi,
    createPromptApi,
    updatePromptApi,
    deletePromptApi
} from '../api/advancedApi';
import {
    Prompt,
    PromptType,
    CreatePromptRequest,
    UpdatePromptRequest
} from '../types/shared';

interface PromptsContextType {
    // State
    prompts: Prompt[];
    isLoading: boolean;
    error: Error | null;
    selectedPrompt: Prompt | null;

    // Methods
    fetchPrompts: (filters?: { type?: PromptType; tag?: string; onlyMine?: boolean }) => Promise<void>;
    getPromptById: (promptId: string) => Promise<Prompt | null>;
    createPrompt: (promptData: CreatePromptRequest) => Promise<Prompt | null>;
    updatePrompt: (promptId: string, promptData: UpdatePromptRequest) => Promise<Prompt | null>;
    deletePrompt: (promptId: string) => Promise<boolean>;
    selectPrompt: (prompt: Prompt | null) => void;
    filterPromptsByType: (type: PromptType | null) => Promise<void>;
    filterPromptsByTag: (tag: string | null) => Promise<void>;
    clearFilters: () => Promise<void>;
}

// Create context with a default undefined value
const PromptsContext = createContext<PromptsContextType | undefined>(undefined);

// Props for the PromptsProvider
interface PromptsProviderProps {
    children: React.ReactNode;
}

// Provider component
export const PromptsProvider: React.FC<PromptsProviderProps> = ({ children }) => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

    // Current filter state
    const [currentFilters, setCurrentFilters] = useState<{
        type?: PromptType;
        tag?: string;
        onlyMine?: boolean;
    }>({});

    // Fetch prompts with optional filters
    const fetchPrompts = useCallback(async (filters?: {
        type?: PromptType;
        tag?: string;
        onlyMine?: boolean;
    }) => {
        setIsLoading(true);
        setError(null);

        try {
            const mergedFilters = { ...currentFilters, ...filters };
            setCurrentFilters(mergedFilters);

            const response = await getPromptsApi(mergedFilters);

            if (response.error) {
                throw new Error(response.error);
            }

            // Assuming the response structure has a data property or is an array
            const promptsData = Array.isArray(response)
                ? response
                : (response.data as Prompt[] || []);

            setPrompts(promptsData);
        } catch (err) {
            console.error('Error fetching prompts:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch prompts'));
        } finally {
            setIsLoading(false);
        }
    }, [currentFilters]);

    // Get a single prompt by ID
    const getPromptById = useCallback(async (promptId: string): Promise<Prompt | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await getPromptByIdApi(promptId);

            if (response.error) {
                throw new Error(response.error);
            }

            // Return the prompt data
            return response as unknown as Prompt;
        } catch (err) {
            console.error(`Error fetching prompt ${promptId}:`, err);
            setError(err instanceof Error ? err : new Error(`Failed to fetch prompt ${promptId}`));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create a new prompt
    const createPrompt = useCallback(async (promptData: CreatePromptRequest): Promise<Prompt | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await createPromptApi(promptData);

            if (response.error) {
                throw new Error(response.error);
            }

            // Get the created prompt
            const newPrompt = response as unknown as Prompt;

            // Update the prompts list
            setPrompts(prev => [newPrompt, ...prev]);

            return newPrompt;
        } catch (err) {
            console.error('Error creating prompt:', err);
            setError(err instanceof Error ? err : new Error('Failed to create prompt'));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update an existing prompt
    const updatePrompt = useCallback(async (promptId: string, promptData: UpdatePromptRequest): Promise<Prompt | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await updatePromptApi(promptId, promptData);

            if (response.error) {
                throw new Error(response.error);
            }

            // Get the updated prompt
            const updatedPrompt = response as unknown as Prompt;

            // Update the prompts list
            setPrompts(prev =>
                prev.map(p => p.promptId === promptId ? updatedPrompt : p)
            );

            // Also update selected prompt if this was the one selected
            if (selectedPrompt?.promptId === promptId) {
                setSelectedPrompt(updatedPrompt);
            }

            return updatedPrompt;
        } catch (err) {
            console.error(`Error updating prompt ${promptId}:`, err);
            setError(err instanceof Error ? err : new Error(`Failed to update prompt ${promptId}`));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [selectedPrompt]);

    // Delete a prompt
    const deletePrompt = useCallback(async (promptId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await deletePromptApi(promptId);

            if (response.error) {
                throw new Error(response.error);
            }

            // Remove the deleted prompt from the list
            setPrompts(prev => prev.filter(p => p.promptId !== promptId));

            // Clear selected prompt if this was the one selected
            if (selectedPrompt?.promptId === promptId) {
                setSelectedPrompt(null);
            }

            return true;
        } catch (err) {
            console.error(`Error deleting prompt ${promptId}:`, err);
            setError(err instanceof Error ? err : new Error(`Failed to delete prompt ${promptId}`));
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [selectedPrompt]);

    // Select a prompt
    const selectPrompt = useCallback((prompt: Prompt | null) => {
        setSelectedPrompt(prompt);
    }, []);

    // Filter prompts by type
    const filterPromptsByType = useCallback(async (type: PromptType | null) => {
        const filters = type ? { ...currentFilters, type } : { ...currentFilters };

        if (!type && filters.type) {
            delete filters.type;
        }

        await fetchPrompts(filters);
    }, [currentFilters, fetchPrompts]);

    // Filter prompts by tag
    const filterPromptsByTag = useCallback(async (tag: string | null) => {
        const filters = tag ? { ...currentFilters, tag } : { ...currentFilters };

        if (!tag && filters.tag) {
            delete filters.tag;
        }

        await fetchPrompts(filters);
    }, [currentFilters, fetchPrompts]);

    // Clear all filters
    const clearFilters = useCallback(async () => {
        setCurrentFilters({});
        await fetchPrompts({});
    }, [fetchPrompts]);

    // Load prompts on mount
    useEffect(() => {
        fetchPrompts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = {
        prompts,
        isLoading,
        error,
        selectedPrompt,
        fetchPrompts,
        getPromptById,
        createPrompt,
        updatePrompt,
        deletePrompt,
        selectPrompt,
        filterPromptsByType,
        filterPromptsByTag,
        clearFilters
    };

    return (
        <PromptsContext.Provider value={value}>
            {children}
        </PromptsContext.Provider>
    );
};

// Custom hook to use the prompts context
export const usePrompts = (): PromptsContextType => {
    const context = useContext(PromptsContext);

    if (context === undefined) {
        throw new Error('usePrompts must be used within a PromptsProvider');
    }

    return context;
};

export default PromptsContext;