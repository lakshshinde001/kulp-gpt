import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

interface UserState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  setUser: (user: User | null) => void
  login: (user: User) => void
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user
      }),

      login: (user) => set({
        user,
        isAuthenticated: true
      }),

      logout: async () => {
        try {
          // Call logout API to clear server-side session/cookies
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // Clear localStorage
          localStorage.removeItem('user');

          // Clear cookie client-side
          document.cookie = 'user-auth=; path=/; max-age=0;';

          // Update store state
          set({
            user: null,
            isAuthenticated: false
          });

        } catch (error) {
          console.error('Logout error:', error);
          // Even if API call fails, clear local state
          set({
            user: null,
            isAuthenticated: false
          });
        }
      },

      setLoading: (isLoading) => set({ isLoading })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)
