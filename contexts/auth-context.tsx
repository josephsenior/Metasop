"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { ensureGuestSessionId } from "@/lib/api/guest-session";

/** Guest-only app; no login/auth. useAuth() for compatibility (isAuthenticated always false, user null). */
interface GuestContextType {
  user: null;
  isAuthenticated: false;
  isLoading: false;
  error: null;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureGuestSessionId();
  }, []);

  const value = useMemo<GuestContextType>(
    () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
    []
  );

  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
