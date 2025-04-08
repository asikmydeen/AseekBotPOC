// app/store/artifactStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import artifactService, { Artifact } from '../utils/artifactService';

interface ArtifactState {
  // State
  artifacts: Artifact[];
  selectedArtifactId: string | null;
  
  // Actions
  setArtifacts: (artifacts: Artifact[]) => void;
  setSelectedArtifactId: (id: string | null) => void;
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => Artifact;
  updateArtifact: (id: string, updates: Partial<Omit<Artifact, 'id' | 'createdAt'>>) => Artifact | null;
  removeArtifact: (id: string) => boolean;
  parseArtifactsFromMessage: (message: string) => void;
}

export const useArtifactStore = create<ArtifactState>()(
  persist(
    (set, get) => ({
      // Initial state
      artifacts: [],
      selectedArtifactId: null,
      
      // Set artifacts
      setArtifacts: (artifacts) => set({ artifacts }),
      
      // Set selected artifact ID
      setSelectedArtifactId: (selectedArtifactId) => set({ selectedArtifactId }),
      
      // Add a new artifact
      addArtifact: (artifact) => {
        const newArtifact = artifactService.addArtifact(artifact);
        set((state) => ({
          artifacts: [newArtifact, ...state.artifacts],
        }));
        return newArtifact;
      },
      
      // Update an existing artifact
      updateArtifact: (id, updates) => {
        const updatedArtifact = artifactService.updateArtifact(id, updates);
        if (updatedArtifact) {
          set((state) => ({
            artifacts: state.artifacts.map((a) => 
              a.id === id ? updatedArtifact : a
            ),
          }));
        }
        return updatedArtifact;
      },
      
      // Remove an artifact
      removeArtifact: (id) => {
        const removed = artifactService.removeArtifact(id);
        if (removed) {
          set((state) => ({
            artifacts: state.artifacts.filter((a) => a.id !== id),
            selectedArtifactId: state.selectedArtifactId === id ? null : state.selectedArtifactId,
          }));
        }
        return removed;
      },
      
      // Parse artifacts from a message
      parseArtifactsFromMessage: (message) => {
        const parsedArtifacts = artifactService.parseArtifactsFromMessage(message);
        
        if (parsedArtifacts.length > 0) {
          // Store the IDs of added artifacts
          const addedArtifactIds: string[] = [];
          
          // Add each artifact
          parsedArtifacts.forEach((artifact) => {
            // Use type assertion to convert string to the specific union type
            const validType = artifact.type as 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg';
            
            const newArtifact = get().addArtifact({
              title: artifact.title,
              content: artifact.content,
              type: validType,
              language: artifact.language,
            });
            
            addedArtifactIds.push(newArtifact.id);
          });
          
          // Select the first added artifact if we have any
          if (addedArtifactIds.length > 0) {
            set({ selectedArtifactId: addedArtifactIds[0] });
          }
        }
      },
    }),
    {
      name: 'artifact-storage', // unique name for localStorage
      partialize: (state) => ({ artifacts: state.artifacts, selectedArtifactId: state.selectedArtifactId }),
    }
  )
);

// Initialize store with artifacts from service
if (typeof window !== 'undefined') {
  // Subscribe to artifact service updates
  artifactService.subscribe((artifacts) => {
    useArtifactStore.setState({ artifacts });
  });
}
