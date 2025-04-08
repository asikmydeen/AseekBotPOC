"use client";
import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

/**
 * Component that initializes the theme on the client side
 * This ensures that the theme is applied after hydration
 */
export default function ThemeInitializer() {
  const { isDarkMode } = useThemeStore();
  
  // Apply theme on mount and when isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // This component doesn't render anything
  return null;
}
