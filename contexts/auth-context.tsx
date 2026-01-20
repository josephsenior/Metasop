"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/auth/token-storage";
import { ensureGuestSessionId } from "@/lib/api/guest-session";
import {
  setupTokenRefresh,
  clearTokenRefresh,
} from "@/lib/auth/token-refresh";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  loginWithProvider: (provider: "google" | "github") => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize guest session on mount
  useEffect(() => {
    ensureGuestSessionId();
  }, []);

  // Sync with NextAuth session
  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (session?.user) {
      // Bridge NextAuth user to our User type
      const nextUser = session.user as any;
      const bridgedUser: User = {
        id: nextUser.id || "",
        email: nextUser.email || "",
        username: nextUser.name || nextUser.email?.split("@")[0] || "user",
        name: nextUser.name || "",
        role: nextUser.role || "user",
        emailVerified: true, // Assuming OAuth or successful credential login verifies email
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        image: nextUser.image,
      } as any;

      setUser(bridgedUser);
      setIsAuthenticated(true);
    } else {
      // Fallback to existing token storage for backward compatibility if needed
      const token = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser();

      if (token && storedUser) {
        setUser(storedUser as unknown as User);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  }, [session, status]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const result = await signIn("credentials", {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // If we still use the old API for some reason, we can call it here
      // But for now, NextAuth handles it.
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || "Login failed. Please check your credentials.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithProvider = useCallback(async (provider: "google" | "github") => {
    try {
      setError(null);
      setIsLoading(true);
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || `Login with ${provider} failed.`;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      // For registration, we might still want to use the authApi
      const response = await authApi.register(data);

      // After registration, log in with credentials
      await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user as unknown as Record<string, unknown>);
      setUser(response.user);
      setIsAuthenticated(true);
      setupTokenRefresh(response.expires_in);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({ redirect: false });
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      tokenStorage.clear();
      clearTokenRefresh();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      tokenStorage.setUser(currentUser as unknown as Record<string, unknown>);
      
      // Also update NextAuth session if it exists
      if (session) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: currentUser.name,
            image: currentUser.image,
          }
        });
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
      // If refresh fails, user might be logged out
      tokenStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      loginWithProvider,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      loginWithProvider,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

