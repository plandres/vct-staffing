"use client";

import { useMemo } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthStateContext, AuthActionsContext } from "@/lib/context/AuthContext";
import { useAuthState } from "@/lib/hooks/useAuth";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { signInWithMicrosoft, signOut, ...state } = useAuthState();

  // Actions object is stable (functions never change identity across renders)
  const actions = useMemo(
    () => ({ signInWithMicrosoft, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <AuthActionsContext.Provider value={actions}>
      <AuthStateContext.Provider value={state}>
        {children}
      </AuthStateContext.Provider>
    </AuthActionsContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
