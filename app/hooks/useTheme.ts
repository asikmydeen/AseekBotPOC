// app/hooks/useTheme.ts
import { useThemeStore } from '../store/themeStore';

/**
 * Custom hook for accessing theme state and actions
 * This provides a drop-in replacement for the old useTheme hook
 */
export function useTheme() {
  const { isDarkMode, toggleTheme, setDarkMode } = useThemeStore();
  
  return {
    isDarkMode,
    toggleTheme,
    setDarkMode
  };
}
