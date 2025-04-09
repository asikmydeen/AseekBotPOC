'use client';

import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { ArtifactProvider } from './ArtifactContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders component that wraps the application with all necessary context providers
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <ArtifactProvider>
        {children}
      </ArtifactProvider>
    </ThemeProvider>
  );
};

export default AppProviders;
