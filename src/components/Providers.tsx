"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { AuthContext } from "@/lib/context/AuthContext";
import { useAuthState } from "@/lib/hooks/useAuth";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
