"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  sopCompanyIds: string[];
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    role: "viewer",
    isLoading: true,
    sopCompanyIds: [],
  });

  const supabase = createClient();

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      let sopCompanyIds: string[] = [];
      if (profile?.role === "sop") {
        const { data: sops } = await supabase
          .from("sop_assignments")
          .select("company_id")
          .eq("sop_id", userId);
        sopCompanyIds = sops?.map((s) => s.company_id) ?? [];
      }

      return { profile, sopCompanyIds };
    },
    [supabase]
  );

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { profile, sopCompanyIds } = await fetchProfile(user.id);
        setState({
          user,
          profile: profile as Profile | null,
          role: (profile?.role as UserRole) ?? "viewer",
          isLoading: false,
          sopCompanyIds,
        });
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { profile, sopCompanyIds } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          profile: profile as Profile | null,
          role: (profile?.role as UserRole) ?? "viewer",
          isLoading: false,
          sopCompanyIds,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          profile: null,
          role: "viewer",
          isLoading: false,
          sopCompanyIds: [],
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signInWithMicrosoft,
    signOut,
  };
}
