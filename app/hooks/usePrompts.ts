// app/hooks/usePrompts.ts
import { useEffect, useRef } from 'react';
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

  // Use a ref to track if we've already initiated a fetch
  const hasFetchedRef = useRef(false);

  // Fetch prompts on mount (similar to what the original context provider did)
  useEffect(() => {
    // Only fetch if we don't already have prompts, we're not already loading, and we haven't already initiated a fetch
    if (prompts.length === 0 && !isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPrompts();
    }
  }, [isLoading, fetchPrompts]);

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
