"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the shape of our theme context
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => { },
});

// Props for the ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode;
  initialDarkMode?: boolean;
}

// ThemeProvider component to wrap around the application
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialDarkMode = false,
}) => {
  // Check localStorage for theme preference on initial load
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('aseekbot-theme');
      return savedTheme ? savedTheme === 'dark' : initialDarkMode;
    }
    return initialDarkMode;
  });

  // Toggle function to switch between light and dark mode
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      // Save theme preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('aseekbot-theme', newMode ? 'dark' : 'light');
      }
      return newMode;
    });
  };

  // Apply theme class to document on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  // Value object that will be provided to consumers
  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for consuming the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

// Export the context for direct usage if needed
export default ThemeContext;