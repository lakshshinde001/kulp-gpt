import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  id: number
  name: string
  email: string
  createdAt: string
  // Add any other user details you want to store
  avatar?: string
  slackId?: string
  role?: string
}

interface UserState {
  user: User | null
  accessToken: string | null
  tokenExpiry: number | null // timestamp in milliseconds
  isLoading: boolean
  isAuthenticated: boolean
  isInitializing: boolean // flag to prevent initializeAuth during login/logout

  setUser: (user: User | null) => void
  login: (user: User, accessToken?: string) => void
  logout: () => Promise<void>
  setLoading: (loading: boolean) => void
  checkTokenValidity: () => boolean
  initializeAuth: () => void
}

export const useUserStore = create<UserState>()(persist(devtools((set, get) => ({
  user: null,
  accessToken: null,
  tokenExpiry: null,
  isLoading: false,
  isAuthenticated: false,
  isInitializing: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user
  }),

  login: (user, accessToken) => {
    // Generate access token if not provided (for backward compatibility)
    const token = accessToken || generateAccessToken();
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 1 day from now

    set({
      user,
      accessToken: token,
      tokenExpiry: expiry,
      isAuthenticated: true,
      isInitializing: false
    });

    // Set authentication cookie for middleware (same as before)
    document.cookie = `user-auth=${user.id}; path=/; max-age=86400; samesite=strict`;
  },

  logout: async () => {
    set({ isInitializing: true }); // Prevent initializeAuth during logout

    try {
      // Call logout API to clear server-side session/cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Clear localStorage
      localStorage.removeItem('user-storage');

      // Clear cookie client-side
      document.cookie = 'user-auth=; path=/; max-age=0;';

      // Update store state
      set({
        user: null,
        accessToken: null,
        tokenExpiry: null,
        isAuthenticated: false,
        isInitializing: false
      });

    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      set({
        user: null,
        accessToken: null,
        tokenExpiry: null,
        isAuthenticated: false,
        isInitializing: false
      });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  checkTokenValidity: () => {
    const { tokenExpiry, accessToken } = get();
    if (!accessToken || !tokenExpiry) {
      return false;
    }
    return Date.now() < tokenExpiry;
  },

  initializeAuth: () => {
    const { checkTokenValidity, logout, isInitializing, isAuthenticated } = get();

    // Don't run if we're already initializing or just logged in
    if (isInitializing || isAuthenticated) {
      return;
    }

    // Check if token is still valid on app initialization
    if (!checkTokenValidity()) {
      // Token expired, auto-logout
      logout();
    }
  }
}), { name: 'user-store' }), {
  name: 'user-storage',
  partialize: (state: UserState) => ({
    user: state.user,
    accessToken: state.accessToken,
    tokenExpiry: state.tokenExpiry,
    isAuthenticated: state.isAuthenticated
  }),
}))

// Helper function to generate a simple access token
function generateAccessToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
