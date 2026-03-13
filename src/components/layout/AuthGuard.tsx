"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import type { UserRole } from "@/types/database";
import { hasMinRole } from "@/lib/utils/roles";
import { Clock, XCircle } from "lucide-react";

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
  const { isLoading, user, role, status, signOut } = useAuth();
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
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  // Account pending approval
  if (status === "pending") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-sm w-full mx-4 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold">Demande en attente</h1>
          <p className="text-sm text-muted-foreground">
            Votre compte <span className="font-medium">{user.email}</span> a bien été créé.
            Un administrateur doit valider votre accès avant que vous puissiez utiliser l&apos;application.
          </p>
          <p className="text-xs text-muted-foreground">
            Vous recevrez une notification une fois votre accès accordé.
          </p>
          <button
            onClick={() => signOut()}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Account rejected
  if (status === "rejected") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-sm w-full mx-4 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p className="text-sm text-muted-foreground">
            Votre demande d&apos;accès pour <span className="font-medium">{user.email}</span> a été refusée.
            Contactez un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
          <button
            onClick={() => signOut()}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  if (!hasMinRole(role, effectiveRole)) {
    return (
      fallback ?? (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Accès refusé</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vous n&apos;avez pas les permissions nécessaires pour voir cette page.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
