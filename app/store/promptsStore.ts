// app/store/promptsStore.ts
import { create } from 'zustand';
import { apiService } from '../utils/apiService';
import {
  Prompt,
  PromptType,
  CreatePromptRequest,
  UpdatePromptRequest
} from '../types/shared';

interface PromptsState {
  // State
  prompts: Prompt[];
  isLoading: boolean;
  error: Error | null;
  selectedPrompt: Prompt | null;
  filters: {
    type?: PromptType;
    tag?: string;
    onlyMine?: boolean;
  };

  // Actions
  fetchPrompts: (filters?: { type?: PromptType; tag?: string; onlyMine?: boolean }) => Promise<void>;
  getPromptById: (promptId: string) => Promise<Prompt | null>;
  createPrompt: (promptData: CreatePromptRequest) => Promise<Prompt | null>;
  updatePrompt: (promptId: string, promptData: UpdatePromptRequest) => Promise<Prompt | null>;
  deletePrompt: (promptId: string) => Promise<boolean>;
  selectPrompt: (prompt: Prompt | null) => void;
  filterPromptsByType: (type: PromptType | null) => Promise<void>;
  filterPromptsByTag: (tag: string | null) => Promise<void>;
  clearFilters: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  setPrompts: (prompts: Prompt[]) => void;
}

export const usePromptsStore = create<PromptsState>((set, get) => ({
  // Initial state
  prompts: [],
  isLoading: false,
  error: null,
  selectedPrompt: null,
  filters: {},

  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Set error state
  setError: (error) => set({ error }),

  // Set prompts
  setPrompts: (prompts) => set({ prompts }),

  // Fetch prompts with optional filters
  fetchPrompts: async (filters) => {
    const state = get();
    const mergedFilters = { ...state.filters, ...filters };
    
    set({ isLoading: true, error: null, filters: mergedFilters });
    
    try {
      const response = await apiService.getPrompts();
      
      // Extract prompts from the response
      let promptsData: Prompt[] = [];
      
      if (Array.isArray(response)) {
        promptsData = response as Prompt[];
      } else if (response.prompts && Array.isArray(response.prompts)) {
        promptsData = response.prompts as Prompt[];
      } else if (response.data && Array.isArray(response.data)) {
        promptsData = response.data as Prompt[];
      }
      
      // Apply filters if needed
      let filteredPrompts = promptsData;
      
      if (mergedFilters.type) {
        filteredPrompts = filteredPrompts.filter(p => p.type === mergedFilters.type);
      }
      
      if (mergedFilters.tag) {
        filteredPrompts = filteredPrompts.filter(p => 
          p.tags && p.tags.some(tag => tag.toLowerCase() === mergedFilters.tag?.toLowerCase())
        );
      }
      
      if (mergedFilters.onlyMine) {
        // Implement filtering by user if needed
        // filteredPrompts = filteredPrompts.filter(p => p.createdBy === currentUser);
      }
      
      set({ prompts: filteredPrompts, isLoading: false });
    } catch (err) {
      console.error('Error fetching prompts:', err);
      set({ 
        error: err instanceof Error ? err : new Error('Failed to fetch prompts'),
        isLoading: false 
      });
    }
  },

  // Get a prompt by ID
  getPromptById: async (promptId) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getPromptById(promptId);
      set({ isLoading: false });
      return response as unknown as Prompt;
    } catch (err) {
      console.error(`Error fetching prompt ${promptId}:`, err);
      set({ 
        error: err instanceof Error ? err : new Error(`Failed to fetch prompt ${promptId}`),
        isLoading: false 
      });
      return null;
    }
  },

  // Create a new prompt
  createPrompt: async (promptData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.createPrompt(promptData);
      const newPrompt = response as unknown as Prompt;
      
      // Update the prompts list
      set(state => ({ 
        prompts: [newPrompt, ...state.prompts],
        isLoading: false 
      }));
      
      return newPrompt;
    } catch (err) {
      console.error('Error creating prompt:', err);
      set({ 
        error: err instanceof Error ? err : new Error('Failed to create prompt'),
        isLoading: false 
      });
      return null;
    }
  },

  // Update an existing prompt
  updatePrompt: async (promptId, promptData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.updatePrompt(promptId, promptData);
      const updatedPrompt = response as unknown as Prompt;
      
      // Update the prompts list and selected prompt if needed
      set(state => {
        const updatedPrompts = state.prompts.map(p => 
          p.promptId === promptId ? updatedPrompt : p
        );
        
        return { 
          prompts: updatedPrompts,
          selectedPrompt: state.selectedPrompt?.promptId === promptId 
            ? updatedPrompt 
            : state.selectedPrompt,
          isLoading: false 
        };
      });
      
      return updatedPrompt;
    } catch (err) {
      console.error(`Error updating prompt ${promptId}:`, err);
      set({ 
        error: err instanceof Error ? err : new Error(`Failed to update prompt ${promptId}`),
        isLoading: false 
      });
      return null;
    }
  },

  // Delete a prompt
  deletePrompt: async (promptId) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiService.deletePrompt(promptId);
      
      // Remove the deleted prompt from the list and clear selected prompt if needed
      set(state => {
        const updatedPrompts = state.prompts.filter(p => p.promptId !== promptId);
        
        return { 
          prompts: updatedPrompts,
          selectedPrompt: state.selectedPrompt?.promptId === promptId 
            ? null 
            : state.selectedPrompt,
          isLoading: false 
        };
      });
      
      return true;
    } catch (err) {
      console.error(`Error deleting prompt ${promptId}:`, err);
      set({ 
        error: err instanceof Error ? err : new Error(`Failed to delete prompt ${promptId}`),
        isLoading: false 
      });
      return false;
    }
  },

  // Select a prompt
  selectPrompt: (prompt) => {
    set({ selectedPrompt: prompt });
  },

  // Filter prompts by type
  filterPromptsByType: async (type) => {
    const state = get();
    const filters = type 
      ? { ...state.filters, type } 
      : { ...state.filters };
    
    if (!type && filters.type) {
      delete filters.type;
    }
    
    await get().fetchPrompts(filters);
  },

  // Filter prompts by tag
  filterPromptsByTag: async (tag) => {
    const state = get();
    const filters = tag 
      ? { ...state.filters, tag } 
      : { ...state.filters };
    
    if (!tag && filters.tag) {
      delete filters.tag;
    }
    
    await get().fetchPrompts(filters);
  },

  // Clear all filters
  clearFilters: async () => {
    set({ filters: {} });
    await get().fetchPrompts({});
  }
}));
