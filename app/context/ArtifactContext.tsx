'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define artifact types
export type ArtifactType = 'html' | 'react' | 'code' | 'image' | 'chart';

// Define artifact interface
export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: ArtifactType;
  language?: string;
  createdAt: Date;
}

// Define context type
interface ArtifactContextType {
  artifacts: Artifact[];
  addArtifact: (artifact: Omit<Artifact, 'id' | 'createdAt'>) => void;
  removeArtifact: (id: string) => void;
  clearArtifacts: () => void;
  parseArtifactsFromMessage: (message: string) => void;
}

// Create context
const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined);

// Generate a unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Provider component
export const ArtifactProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  // Load artifacts from localStorage on mount
  useEffect(() => {
    const storedArtifacts = localStorage.getItem('artifacts');
    if (storedArtifacts) {
      try {
        const parsedArtifacts = JSON.parse(storedArtifacts);
        // Convert string dates back to Date objects
        const formattedArtifacts = parsedArtifacts.map((artifact: any) => ({
          ...artifact,
          createdAt: new Date(artifact.createdAt)
        }));
        setArtifacts(formattedArtifacts);
      } catch (error) {
        console.error('Failed to parse stored artifacts:', error);
      }
    }
  }, []);

  // Save artifacts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('artifacts', JSON.stringify(artifacts));
  }, [artifacts]);

  // Add a new artifact
  const addArtifact = (artifactData: Omit<Artifact, 'id' | 'createdAt'>) => {
    const newArtifact: Artifact = {
      ...artifactData,
      id: generateId(),
      createdAt: new Date()
    };
    
    setArtifacts(prevArtifacts => [...prevArtifacts, newArtifact]);
  };

  // Remove an artifact
  const removeArtifact = (id: string) => {
    setArtifacts(prevArtifacts => prevArtifacts.filter(artifact => artifact.id !== id));
  };

  // Clear all artifacts
  const clearArtifacts = () => {
    setArtifacts([]);
  };

  // Parse code blocks from a message and create artifacts
  const parseArtifactsFromMessage = (message: string) => {
    // Regular expression to match code blocks with language specification
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    let artifactsAdded = 0;

    while ((match = codeBlockRegex.exec(message)) !== null) {
      const language = match[1].toLowerCase();
      const code = match[2].trim();
      
      if (code) {
        // Determine artifact type based on language
        let type: ArtifactType = 'code';
        if (language === 'html') {
          type = 'html';
        } else if (language === 'jsx' || language === 'tsx' || code.includes('import React')) {
          type = 'react';
        }

        // Create a title based on the content
        let title = `${language.charAt(0).toUpperCase() + language.slice(1)} Snippet`;
        
        // Try to extract a more meaningful title from the code
        if (type === 'react') {
          const componentMatch = code.match(/function\s+(\w+)|class\s+(\w+)|const\s+(\w+)\s*=/);
          if (componentMatch) {
            const componentName = componentMatch[1] || componentMatch[2] || componentMatch[3];
            if (componentName) {
              title = `${componentName} Component`;
            }
          }
        } else if (type === 'code') {
          const functionMatch = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*function|const\s+(\w+)\s*=\s*\(/);
          if (functionMatch) {
            const functionName = functionMatch[1] || functionMatch[2] || functionMatch[3];
            if (functionName) {
              title = `${functionName} Function`;
            }
          }
        }

        // Add the artifact
        addArtifact({
          title,
          content: code,
          type,
          language
        });

        artifactsAdded++;
      }
    }

    return artifactsAdded;
  };

  return (
    <ArtifactContext.Provider value={{ 
      artifacts, 
      addArtifact, 
      removeArtifact, 
      clearArtifacts,
      parseArtifactsFromMessage
    }}>
      {children}
    </ArtifactContext.Provider>
  );
};

// Custom hook to use the artifact context
export const useArtifacts = (): ArtifactContextType => {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error('useArtifacts must be used within an ArtifactProvider');
  }
  return context;
};
