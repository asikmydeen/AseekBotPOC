// app/store/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  // State
  isDarkMode: boolean;
  
  // Actions
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Initial state
      isDarkMode: true,
      
      // Toggle between light and dark mode
      toggleTheme: () => set((state) => {
        const newMode = !state.isDarkMode;
        
        // Apply or remove the 'dark' class on the document root
        if (typeof document !== 'undefined') {
          if (newMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        return { isDarkMode: newMode };
      }),
      
      // Set dark mode explicitly
      setDarkMode: (isDark) => set(() => {
        // Apply or remove the 'dark' class on the document root
        if (typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        
        return { isDarkMode: isDark };
      }),
    }),
    {
      name: 'theme-storage', // unique name for localStorage
    }
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const { isDarkMode } = useThemeStore.getState();
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
