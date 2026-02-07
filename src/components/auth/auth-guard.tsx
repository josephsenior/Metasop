"use client";

/** Guest-only app; no login. Guard always renders children. */
export function AuthGuard({
  children,
}: {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: string;
  redirectTo?: string;
}) {
  return <>{children}</>;
}
