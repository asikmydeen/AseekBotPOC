"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import EnhancedFileDialog from '../components/prompts/EnhancedFileDialog';
import { Prompt, UploadedFile } from '../types/shared';

interface VariableType {
  type: 'text' | 'file' | 'number' | 'date' | 'select';
  options?: string[];
}

interface ModalContextType {
  openFileSelectionDialog: (
    prompt: Prompt,
    requiredFileCount: number,
    requiredVariables: string[],
    onSubmit: (files: UploadedFile[], variables: Record<string, string>, prompt: Prompt) => void,
    variableTypes?: Record<string, VariableType>
  ) => void;
  closeFileSelectionDialog: () => void;
  currentPrompt: Prompt | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<Prompt | null>(null);
  const [requiredFileCount, setRequiredFileCount] = useState(0);
  const [requiredVariables, setRequiredVariables] = useState<string[]>([]);
  const [variableTypes, setVariableTypes] = useState<Record<string, VariableType>>({});
  const [onFileSubmit, setOnFileSubmit] = useState<((files: UploadedFile[], variables: Record<string, string>, prompt: Prompt) => void) | null>(null);

  const openFileSelectionDialog = (
    prompt: Prompt,
    fileCount: number,
    variables: string[],
    onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void,
    types: Record<string, VariableType> = {}
  ) => {
    console.log('ModalContext: openFileSelectionDialog called with prompt:', prompt.title);
    console.log('ModalContext: Required file count:', fileCount);
    console.log('ModalContext: Required variables:', variables);

    // Set the current prompt - this is critical for the handleFileSelection callback
    setCurrentPrompt(prompt);
    console.log('ModalContext: Set currentPrompt state to:', prompt.title);

    // Set other dialog properties
    setRequiredFileCount(fileCount);
    setRequiredVariables(variables);
    setVariableTypes(types);

    console.log('ModalContext: Setting onFileSubmit callback');
    setOnFileSubmit(() => onSubmit);

    console.log('ModalContext: Opening file dialog');
    setFileDialogOpen(true);
  };

  const closeFileSelectionDialog = () => {
    console.log('ModalContext: Closing file selection dialog');
    setFileDialogOpen(false);
    // Don't immediately clear the prompt and variables to avoid UI flicker
    // They will be reset when the dialog is opened again
    // IMPORTANT: We keep the currentPrompt state to ensure it's available for the handleFileSelection callback
    console.log('ModalContext: Keeping currentPrompt state:', currentPrompt?.title);
  };

  const handleSubmit = (files: UploadedFile[], variables: Record<string, string>) => {
    console.log('ModalContext: handleSubmit called with', files.length, 'files and', Object.keys(variables).length, 'variables');
    console.log('ModalContext: Current prompt:', currentPrompt?.title);

    if (onFileSubmit && currentPrompt) {
      console.log('ModalContext: Calling onFileSubmit callback with prompt:', currentPrompt.title);
      // Pass the files, variables, and the current prompt to the callback
      onFileSubmit(files, variables, currentPrompt);
      console.log('ModalContext: onFileSubmit callback called successfully');
    } else if (!currentPrompt) {
      console.error('ModalContext: No current prompt found!');
    } else {
      console.error('ModalContext: onFileSubmit callback is not defined!');
    }

    console.log('ModalContext: Closing file selection dialog');
    closeFileSelectionDialog();
  };

  return (
    <ModalContext.Provider
      value={{
        openFileSelectionDialog,
        closeFileSelectionDialog,
        currentPrompt
      }}
    >
      {children}

      {/* File Selection Dialog - Rendered at the root level */}
      {currentPrompt && (
        <EnhancedFileDialog
          isOpen={fileDialogOpen}
          onClose={closeFileSelectionDialog}
          onSubmit={handleSubmit}
          promptId={currentPrompt.promptId}
          promptTitle={currentPrompt.title}
          requiredFileCount={requiredFileCount}
          requiredVariables={requiredVariables}
          variableTypes={variableTypes}
        />
      )}
    </ModalContext.Provider>
  );
};
