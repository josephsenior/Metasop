"use client"

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/types/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: UserRole;
  redirectTo?: string;
}

/**
 * AuthGuard component to protect routes
 *
 * @param requireAuth - If true, redirects to login if not authenticated
 * @param requireRole - If specified, only allows users with this role
 * @param redirectTo - Custom redirect path (default: /login)
 */
export function AuthGuard({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = "/login",
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // In dev mode, bypass all auth checks
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  useEffect(() => {
    if (isLoading) return;
    
    // Skip all checks in dev mode
    if (isDevMode) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      // Save current location for redirect after login
      const currentPath = pathname + (typeof window !== "undefined" ? window.location.search : "");
      router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Check role requirement
    if (requireRole && user && user.role !== requireRole) {
      router.push("/dashboard"); // Redirect to dashboard if role doesn't match
    }
  }, [
    isAuthenticated,
    isLoading,
    requireAuth,
    requireRole,
    user,
    router,
    pathname,
    redirectTo,
    isDevMode,
  ]);

  // Show loading state while checking auth (skip in dev mode)
  if (!isDevMode && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  // In dev mode, always render children
  if (isDevMode) {
    return <>{children}</>;
  }

  // Don't render children if auth requirements not met
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireRole && user && user.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}

