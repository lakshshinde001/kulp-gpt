"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";

export function AuthInitializer() {
  useEffect(() => {
    // Check token validity on app initialization
    useUserStore.getState().initializeAuth();

    // Set up periodic token validation (check every 5 minutes)
    const interval = setInterval(() => {
      const { checkTokenValidity, initializeAuth } = useUserStore.getState();
      if (!checkTokenValidity()) {
        // Token expired, logout will be handled by initializeAuth
        initializeAuth();
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []); // Empty dependency array since we're using getState()

  return null; // This component doesn't render anything
}
