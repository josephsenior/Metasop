"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";
import { authApi } from "@/lib/api/auth";
import { tokenStorage } from "@/lib/auth/token-storage";
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In dev mode, consider user as authenticated
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      // In dev mode, skip auth initialization and set as authenticated
      if (isDevMode) {
        setUser({
          id: "dev_user_id",
          email: "dev@example.com",
          username: "dev_user",
          full_name: "Dev User",
          role: "admin",
          email_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
          subscription_plan: "free",
        } as User);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const token = tokenStorage.getToken();
        const storedUser = tokenStorage.getUser();

        if (token && storedUser) {
          // Verify token is still valid by fetching current user
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser as User);
            setIsAuthenticated(true);
            tokenStorage.setUser(
              currentUser as unknown as Record<string, unknown>,
            );
          } catch {
            // Token invalid, clear storage
            tokenStorage.clear();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isDevMode]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await authApi.login(credentials);

      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user as unknown as Record<string, unknown>);
      setUser(response.user);
      setIsAuthenticated(true);

      // Setup automatic token refresh
      setupTokenRefresh(response.expires_in);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Login failed. Please check your credentials.";
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
      const response = await authApi.register(data);

      tokenStorage.setToken(response.token);
      tokenStorage.setUser(response.user as unknown as Record<string, unknown>);
      setUser(response.user);
      setIsAuthenticated(true);

      // Setup automatic token refresh
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

