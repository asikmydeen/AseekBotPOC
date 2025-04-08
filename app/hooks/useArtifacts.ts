// app/hooks/useArtifacts.ts
import { useArtifactStore } from '../store/artifactStore';

/**
 * Custom hook for accessing artifact state and actions
 * This provides a drop-in replacement for the old useArtifacts hook
 */
export function useArtifacts() {
  const {
    artifacts,
    selectedArtifactId,
    setSelectedArtifactId,
    addArtifact,
    updateArtifact,
    removeArtifact,
    parseArtifactsFromMessage
  } = useArtifactStore();
  
  return {
    artifacts,
    selectedArtifactId,
    setSelectedArtifactId,
    addArtifact,
    updateArtifact,
    removeArtifact,
    parseArtifactsFromMessage
  };
}
