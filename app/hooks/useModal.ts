// app/hooks/useModal.ts
import { useModalStore } from '../store/modalStore';

/**
 * Custom hook for accessing modal state and actions
 * This provides a drop-in replacement for the old useModal hook
 */
export function useModal() {
  const {
    currentPrompt,
    openFileSelectionDialog,
    closeFileSelectionDialog
  } = useModalStore();
  
  return {
    currentPrompt,
    openFileSelectionDialog,
    closeFileSelectionDialog
  };
}

export default useModal;
