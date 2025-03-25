// app/utils/artifactService.ts
import { v4 as uuidv4 } from 'uuid';

export interface Artifact {
  id: string;
  title: string;
  content: string;
  type: 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg';
  language?: string;
  createdAt: string;
}

class ArtifactService {
  private artifacts: Artifact[] = [];
  private listeners: ((artifacts: Artifact[]) => void)[] = [];

  constructor() {
    // Try to load artifacts from localStorage if available
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('artifacts');
        if (stored) {
          this.artifacts = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load artifacts from storage:', error);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('artifacts', JSON.stringify(this.artifacts));
      } catch (error) {
        console.error('Failed to save artifacts to storage:', error);
      }
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener([...this.artifacts]);
    }
  }

  // Subscribe to artifact changes
  subscribe(listener: (artifacts: Artifact[]) => void): () => void {
    this.listeners.push(listener);
    // Call the listener immediately with current state
    listener([...this.artifacts]);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get all artifacts
  getArtifacts(): Artifact[] {
    return [...this.artifacts];
  }

  // Add a new artifact
  addArtifact(artifact: Omit<Artifact, 'id' | 'createdAt'>): Artifact {
    const newArtifact = {
      ...artifact,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };

    this.artifacts.unshift(newArtifact); // Add to beginning of array
    this.saveToStorage();
    this.notifyListeners();
    return newArtifact;
  }

  // Update an existing artifact
  updateArtifact(id: string, updates: Partial<Omit<Artifact, 'id' | 'createdAt'>>): Artifact | null {
    const index = this.artifacts.findIndex(a => a.id === id);
    if (index === -1) return null;

    this.artifacts[index] = {
      ...this.artifacts[index],
      ...updates
    };

    this.saveToStorage();
    this.notifyListeners();
    return this.artifacts[index];
  }

  // Remove an artifact
  removeArtifact(id: string): boolean {
    const initialLength = this.artifacts.length;
    this.artifacts = this.artifacts.filter(a => a.id !== id);

    if (this.artifacts.length !== initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Get an artifact by ID
  getArtifact(id: string): Artifact | null {
    return this.artifacts.find(a => a.id === id) || null;
  }

  // Detect appropriate language type from content
  detectLanguageFromContent(content: string): string {
    // Check for specific markers in the content
    if (content.includes('<html') || content.includes('<!DOCTYPE html')) {
      return 'html';
    }

    if (content.includes('import React') || content.includes('from "react"') || content.includes('from \'react\'')) {
      return content.includes('typescript') ? 'tsx' : 'jsx';
    }

    if (content.includes('function') && content.includes('return') && content.includes('{') && content.includes('}')) {
      return content.includes('const') ? 'javascript' : 'typescript';
    }

    if (content.includes('def ') && content.includes(':') && !content.includes('{')) {
      return 'python';
    }

    if (content.includes('class ') && content.includes('{') && content.includes('}')) {
      return 'java';
    }

    if (content.includes('#include') && (content.includes('<iostream>') || content.includes('<stdio.h>'))) {
      return content.includes('class') ? 'cpp' : 'c';
    }

    if (content.trim().startsWith('```') || content.includes('# ') || content.includes('## ')) {
      return 'markdown';
    }

    // If no specific markers are found, default to text
    return 'text';
  }

  // Detect appropriate artifact type from content
  detectArtifactType(content: string): 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg' {
    // Check for SVG content
    if (content.includes('<svg') && content.includes('</svg>')) {
      return 'svg';
    }

    // Check for HTML content
    if (content.includes('<html') || content.includes('<!DOCTYPE html') ||
      (content.includes('<') && content.includes('>') && content.includes('</') && !content.includes('```'))) {
      return 'html';
    }

    // Check for React components
    if ((content.includes('import React') || content.includes('from "react"') || content.includes('from \'react\'')) &&
      (content.includes('export default') || content.includes('function') || content.includes('const') || content.includes('class'))) {
      return 'react';
    }

    // Check for Markdown content
    if (content.includes('# ') || content.includes('## ') || content.includes('### ') ||
      (content.includes('```') && content.includes('```\n'))) {
      return 'markdown';
    }

    // Check for Mermaid diagrams
    if (content.includes('```mermaid') || content.startsWith('graph ') || content.startsWith('sequenceDiagram') ||
      content.startsWith('classDiagram') || content.startsWith('gantt')) {
      return 'mermaid';
    }

    // Default to code
    return 'code';
  }

  // Parse and extract artifacts from a message - this is an instance method, not static
  parseArtifactsFromMessage(message: string): { title: string; content: string; type: string; language?: string; }[] {
    const artifacts: { title: string; content: string; type: string; language?: string; }[] = [];

    // Regular expressions to find code blocks in markdown
    const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(message)) !== null) {
      const language = match[1].trim() || 'text';
      const content = match[2];

      // Determine type based on language
      let type: 'html' | 'react' | 'code' | 'image' | 'markdown' | 'mermaid' | 'svg' = 'code';

      if (language === 'html' || language === 'svg') {
        type = language as 'html' | 'svg';
      } else if (language === 'jsx' || language === 'tsx' || language === 'react') {
        type = 'react';
      } else if (language === 'markdown' || language === 'md') {
        type = 'markdown';
      } else if (language === 'mermaid') {
        type = 'mermaid';
      }

      // Generate a title based on type and content
      let title = `${type.charAt(0).toUpperCase() + type.slice(1)} Artifact`;

      // Try to extract a more descriptive title
      if (content.includes('//') || content.includes('/*')) {
        // Look for comments that might contain a title
        const commentMatch = content.match(/(\/\/|\/\*)\s*(.*?)(?:\*\/|\n)/);
        if (commentMatch && commentMatch[2].trim()) {
          title = commentMatch[2].trim();
        }
      } else if (content.includes('class ') || content.includes('function ')) {
        // Look for class or function declarations
        const funcMatch = content.match(/(?:class|function)\s+([A-Za-z0-9_]+)/);
        if (funcMatch && funcMatch[1]) {
          title = `${funcMatch[1]} ${type === 'react' ? 'Component' : 'Function'}`;
        }
      }

      artifacts.push({
        title,
        content,
        type,
        language: language !== type ? language : undefined
      });
    }

    // Check for potential HTML content outside of code blocks
    if (artifacts.length === 0 && message.includes('<html') && message.includes('</html>')) {
      const htmlMatch = message.match(/<html[\s\S]*?<\/html>/);
      if (htmlMatch) {
        artifacts.push({
          title: 'HTML Document',
          content: htmlMatch[0],
          type: 'html'
        });
      }
    }

    return artifacts;
  }
}

// Export a singleton instance
export default new ArtifactService();