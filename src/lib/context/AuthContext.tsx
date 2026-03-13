"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { Profile, UserRole, UserStatus } from "@/types/database";
import type { User } from "@supabase/supabase-js";

// ─── State context (profile, role, loading…) ──────────────────────────────
interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  status: UserStatus;
  isLoading: boolean;
  sopCompanyIds: string[];
}

// ─── Actions context (stable references — never triggers re-render) ────────
interface AuthActions {
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthStateContext = createContext<AuthState | null>(null);
export const AuthActionsContext = createContext<AuthActions | null>(null);

// Merged type kept for backwards-compat
export type AuthContextValue = AuthState & AuthActions;

/** Primary hook — returns state + actions (backwards-compatible) */
export function useAuth(): AuthContextValue {
  const state = useContext(AuthStateContext);
  const actions = useContext(AuthActionsContext);
  if (!state || !actions) throw new Error("useAuth must be used within AuthProvider");
  // Merge without creating a new object on every call — useMemo in caller would
  // be better but this keeps all existing call-sites unchanged.
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

/** Lightweight hook for components that only need actions (e.g. Header) */
export function useAuthActions(): AuthActions {
  const ctx = useContext(AuthActionsContext);
  if (!ctx) throw new Error("useAuthActions must be used within AuthProvider");
  return ctx;
}

// Legacy single-context export kept for Providers.tsx compatibility
export const AuthContext = AuthStateContext;
