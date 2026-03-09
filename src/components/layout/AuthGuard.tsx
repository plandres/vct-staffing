"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/types/database";
import { hasMinRole } from "@/lib/utils/roles";

interface AuthGuardProps {
  children: React.ReactNode;
  minRole?: UserRole;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  minRole = "viewer",
  fallback,
}: AuthGuardProps) {
  const { isLoading, user, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Middleware handles redirect to /login
  }

  if (!hasMinRole(role, minRole)) {
    return (
      fallback ?? (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Access Denied</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
