"use client";

import React, { createContext, useContext } from "react";
import type { Profile, UserRole, UserStatus } from "@/types/database";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  status: UserStatus;
  isLoading: boolean;
  sopCompanyIds: string[];
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
