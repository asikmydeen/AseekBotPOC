// app/hooks/usePrompts.ts
import { useEffect, useRef, useCallback } from 'react';
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

  // Fetch prompts on mount only (not on every render)
  useEffect(() => {
    // Only fetch if we don't already have prompts, we're not already loading, and we haven't already initiated a fetch
    if (prompts.length === 0 && !isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPrompts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this only runs once on mount

  // Wrap fetchPrompts to allow manual refetching
  const wrappedFetchPrompts = useCallback(async (filters?: any) => {
    // We're explicitly calling fetch, so allow it to happen
    return await fetchPrompts(filters);
  }, [fetchPrompts]);

  return {
    prompts,
    isLoading,
    error,
    selectedPrompt,
    fetchPrompts: wrappedFetchPrompts,
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
