// app/hooks/usePrompts.ts
import { usePromptsStore } from '../store/promptsStore';

/**
 * Custom hook for accessing prompts state and actions
 * This provides a drop-in replacement for the old usePrompts hook
 */
export function usePrompts() {
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
  
  return {
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
}
