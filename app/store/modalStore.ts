// app/store/modalStore.ts
import { create } from 'zustand';
import { Prompt, UploadedFile } from '../types/shared';

// Define the variable type interface
export interface VariableType {
  type: 'text' | 'file' | 'number' | 'date' | 'select';
  options?: string[];
}

// Define the modal state interface
interface ModalState {
  // State
  fileDialogOpen: boolean;
  currentPrompt: Prompt | null;
  requiredFileCount: number;
  requiredVariables: string[];
  variableTypes: Record<string, VariableType>;
  onFileSubmit: ((files: UploadedFile[], variables: Record<string, string>, prompt: Prompt) => void) | null;
  
  // Actions
  openFileSelectionDialog: (
    prompt: Prompt,
    requiredFileCount: number,
    requiredVariables: string[],
    onSubmit: (files: UploadedFile[], variables: Record<string, string>, prompt: Prompt) => void,
    variableTypes?: Record<string, VariableType>
  ) => void;
  closeFileSelectionDialog: () => void;
  handleSubmit: (files: UploadedFile[], variables: Record<string, string>) => void;
}

// Create the store
export const useModalStore = create<ModalState>((set, get) => ({
  // Initial state
  fileDialogOpen: false,
  currentPrompt: null,
  requiredFileCount: 0,
  requiredVariables: [],
  variableTypes: {},
  onFileSubmit: null,
  
  // Open file selection dialog
  openFileSelectionDialog: (
    prompt,
    requiredFileCount,
    requiredVariables,
    onSubmit,
    variableTypes = {}
  ) => {
    console.log('ModalStore: openFileSelectionDialog called with prompt:', prompt.title);
    console.log('ModalStore: Required file count:', requiredFileCount);
    console.log('ModalStore: Required variables:', requiredVariables);
    
    set({
      currentPrompt: prompt,
      requiredFileCount,
      requiredVariables,
      variableTypes,
      onFileSubmit: onSubmit,
      fileDialogOpen: true
    });
    
    console.log('ModalStore: Dialog opened');
  },
  
  // Close file selection dialog
  closeFileSelectionDialog: () => {
    console.log('ModalStore: Closing file selection dialog');
    set({ fileDialogOpen: false });
    // Don't immediately clear the prompt and variables to avoid UI flicker
    // They will be reset when the dialog is opened again
  },
  
  // Handle submit
  handleSubmit: (files, variables) => {
    const { onFileSubmit, currentPrompt } = get();
    
    console.log('ModalStore: handleSubmit called with', files.length, 'files and', Object.keys(variables).length, 'variables');
    console.log('ModalStore: Current prompt:', currentPrompt?.title);
    
    if (onFileSubmit && currentPrompt) {
      console.log('ModalStore: Calling onFileSubmit callback with prompt:', currentPrompt.title);
      // Pass the files, variables, and the current prompt to the callback
      onFileSubmit(files, variables, currentPrompt);
      console.log('ModalStore: onFileSubmit callback called successfully');
    } else if (!currentPrompt) {
      console.error('ModalStore: No current prompt found!');
    } else {
      console.error('ModalStore: onFileSubmit callback is not defined!');
    }
    
    console.log('ModalStore: Closing file selection dialog');
    get().closeFileSelectionDialog();
  }
}));
