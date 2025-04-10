// app/store/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  // State
  userId: string;
  
  // Actions
  setUserId: (userId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state - using test-user as default
      userId: 'test-user',
      
      // Set user ID
      setUserId: (userId: string) => set({ userId }),
    }),
    {
      name: 'user-storage', // unique name for localStorage
    }
  )
);

// Helper function to get the current user ID
export const getCurrentUserId = (): string => {
  return useUserStore.getState().userId;
};
