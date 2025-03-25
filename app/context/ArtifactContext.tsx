// app/context/ArtifactContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import artifactService, { Artifact } from '../utils/artifactService';

interface ArtifactContextType {
  artifacts: Artifact[];
  selectedArtifactId: string | null;
  setSelectedArtifactId: React.Dispatch<React.SetStateAction<string | null>>;
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => Artifact;
  updateArtifact: (id: string, updates: Partial<Omit<Artifact, 'id' | 'createdAt'>>) => Artifact | null;
  removeArtifact: (id: string) => boolean;
  parseArtifactsFromMessage: (message: string) => void;
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined);

export const ArtifactProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);

  // Use refs to track if we're in the middle of an update to prevent infinite loops
  const isUpdatingRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  // Subscribe to artifact service updates - use useCallback to prevent recreation on each render
  useEffect(() => {
    // Skip if we're already in the process of updating
    if (isUpdatingRef.current) return;

    const handleArtifactsUpdate = (updatedArtifacts: Artifact[]) => {
      // Set the updating flag to prevent re-renders during this update
      isUpdatingRef.current = true;

      setArtifacts(updatedArtifacts);

      // Handle artifact selection logic
      if (selectedArtifactId === null && updatedArtifacts.length > 0) {
        setSelectedArtifactId(updatedArtifacts[0].id);
      } else if (
        selectedArtifactId !== null &&
        updatedArtifacts.length > 0 &&
        !updatedArtifacts.some(a => a.id === selectedArtifactId)
      ) {
        setSelectedArtifactId(updatedArtifacts[0].id);
      } else if (updatedArtifacts.length === 0) {
        setSelectedArtifactId(null);
      }

      // Reset updating flag after a short delay to ensure React updates have settled
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    };

    // Only subscribe once
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const unsubscribe = artifactService.subscribe(handleArtifactsUpdate);

      return () => {
        unsubscribe();
        hasInitializedRef.current = false;
      };
    }
  }, [selectedArtifactId]);

  // Function to parse artifacts from message and add them - use useCallback to maintain reference stability
  const parseArtifactsFromMessage = useCallback((message: string) => {
    // Skip if we're already in the process of updating
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    try {
      const parsedArtifacts = artifactService.parseArtifactsFromMessage(message);

      if (parsedArtifacts.length > 0) {
        // Store the IDs of added artifacts
        const addedArtifactIds: string[] = [];

        // Add each artifact to the service
        parsedArtifacts.forEach(artifact => {
          // Use type assertion to convert string to the specific union type
          const validType = artifact.type as 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg';

          const newArtifact = artifactService.addArtifact({
            title: artifact.title,
            content: artifact.content,
            type: validType,
            language: artifact.language
          });

          addedArtifactIds.push(newArtifact.id);
        });

        // Select the first added artifact if we have any
        if (addedArtifactIds.length > 0) {
          setSelectedArtifactId(addedArtifactIds[0]);
        }
      }
    } catch (error) {
      console.error('Error parsing artifacts from message:', error);
    } finally {
      // Reset updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, []);

  // Create stable reference to service methods
  const addArtifact = useCallback((artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact => {
    return artifactService.addArtifact(artifact);
  }, []);

  const updateArtifact = useCallback((id: string, updates: Partial<Omit<Artifact, 'id' | 'createdAt'>>): Artifact | null => {
    return artifactService.updateArtifact(id, updates);
  }, []);

  const removeArtifact = useCallback((id: string): boolean => {
    return artifactService.removeArtifact(id);
  }, []);

  const value = {
    artifacts,
    selectedArtifactId,
    setSelectedArtifactId,
    addArtifact,
    updateArtifact,
    removeArtifact,
    parseArtifactsFromMessage
  };

  return (
    <ArtifactContext.Provider value={value}>
      {children}
    </ArtifactContext.Provider>
  );
};

export const useArtifacts = (): ArtifactContextType => {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error('useArtifacts must be used within an ArtifactProvider');
  }
  return context;
};