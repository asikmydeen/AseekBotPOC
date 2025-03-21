 "use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of our theme context
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(initialDarkMode);

  // Toggle function to switch between light and dark mode
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Apply or remove the 'dark' class on the document root based on the current theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
