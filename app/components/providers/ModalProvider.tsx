"use client";
import React, { ReactNode } from 'react';
import { useModalStore } from '../../store/modalStore';
import EnhancedFileDialog from '../prompts/EnhancedFileDialog';

interface ModalProviderProps {
  children: ReactNode;
}

/**
 * ModalProvider component that renders modals based on Zustand store state
 * This replaces the old Context-based ModalProvider
 */
export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const {
    fileDialogOpen,
    currentPrompt,
    requiredFileCount,
    requiredVariables,
    variableTypes,
    closeFileSelectionDialog,
    handleSubmit
  } = useModalStore();

  return (
    <>
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
    </>
  );
};

export default ModalProvider;
