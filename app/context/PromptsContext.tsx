// app/context/PromptsContext.tsx
"use client";
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePromptsStore } from '../store/promptsStore';
import {
    Prompt,
    PromptType,
    CreatePromptRequest,
    UpdatePromptRequest
} from '../types/shared';

// Define the shape of our context
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
    children: ReactNode;
}

// Provider component that uses Zustand store
export const PromptsProvider: React.FC<PromptsProviderProps> = ({ children }) => {
    // Get state and actions from the Zustand store
    const {
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
    } = usePromptsStore();

    // Load prompts on mount
    useEffect(() => {
        fetchPrompts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Create the context value from the Zustand store
    const value: PromptsContextType = {
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