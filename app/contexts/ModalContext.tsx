"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import EnhancedFileDialog from '../components/prompts/EnhancedFileDialog';
import { Prompt, UploadedFile } from '../types/shared';

interface ModalContextType {
  openFileSelectionDialog: (
    prompt: Prompt,
    requiredFileCount: number,
    requiredVariables: string[],
    onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void
  ) => void;
  closeFileSelectionDialog: () => void;
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
  const [onFileSubmit, setOnFileSubmit] = useState<((files: UploadedFile[], variables: Record<string, string>) => void) | null>(null);

  const openFileSelectionDialog = (
    prompt: Prompt,
    fileCount: number,
    variables: string[],
    onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void
  ) => {
    setCurrentPrompt(prompt);
    setRequiredFileCount(fileCount);
    setRequiredVariables(variables);
    setOnFileSubmit(() => onSubmit);
    setFileDialogOpen(true);
  };

  const closeFileSelectionDialog = () => {
    setFileDialogOpen(false);
  };

  const handleSubmit = (files: UploadedFile[], variables: Record<string, string>) => {
    if (onFileSubmit) {
      onFileSubmit(files, variables);
    }
    closeFileSelectionDialog();
  };

  return (
    <ModalContext.Provider
      value={{
        openFileSelectionDialog,
        closeFileSelectionDialog
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
        />
      )}
    </ModalContext.Provider>
  );
};
