"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/types/database";
import { hasMinRole } from "@/lib/utils/roles";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  minRole?: UserRole; // alias for requiredRole
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  minRole,
  fallback,
}: AuthGuardProps) {
  const { isLoading, user, role } = useAuth();
  const router = useRouter();
  const effectiveRole = requiredRole ?? minRole ?? "viewer";

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

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
    // Show loading while redirect happens
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!hasMinRole(role, effectiveRole)) {
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
