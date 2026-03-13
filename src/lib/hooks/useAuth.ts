"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole, UserStatus } from "@/types/database";
import type { User } from "@supabase/supabase-js";

// Re-export useAuth from context so all existing imports keep working
export { useAuth } from "@/lib/context/AuthContext";

interface AuthStateInternal {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  status: UserStatus;
  isLoading: boolean;
  sopCompanyIds: string[];
}

const MAX_PROFILE_RETRIES = 3;
const RETRY_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * useAuthState — internal hook that owns the auth state.
 * Called ONCE in AuthProvider (Providers.tsx). Do not call it elsewhere.
 */
export function useAuthState() {
  const [state, setState] = useState<AuthStateInternal>({
    user: null,
    profile: null,
    role: "viewer",
    status: "pending",
    isLoading: true,
    sopCompanyIds: [],
  });

  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(
    async (userId: string): Promise<{ profile: Profile | null; sopCompanyIds: string[] }> => {
      let profile: Profile | null = null;
      for (let attempt = 0; attempt < MAX_PROFILE_RETRIES; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (data && !error) {
          profile = data as Profile;
          break;
        }

        if (attempt < MAX_PROFILE_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }

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
    let mounted = true;

    const getInitialSession = async () => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth_timeout")), 8000)
      );
      try {
        const {
          data: { session },
        } = await Promise.race([supabase.auth.getSession(), timeout]);
        const user = session?.user ?? null;

        if (user && mounted) {
          const { profile, sopCompanyIds } = await fetchProfile(user.id);
          if (mounted) {
            setState({
              user,
              profile,
              role: (profile?.role as UserRole) ?? "viewer",
              status: (profile?.status as UserStatus) ?? "pending",
              isLoading: false,
              sopCompanyIds,
            });
          }
        } else if (mounted) {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        if (mounted) setState((s) => ({ ...s, isLoading: false }));
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { profile, sopCompanyIds } = await fetchProfile(session.user.id);
        if (mounted) {
          setState({
            user: session.user,
            profile,
            role: (profile?.role as UserRole) ?? "viewer",
            status: (profile?.status as UserStatus) ?? "pending",
            isLoading: false,
            sopCompanyIds,
          });
        }
      } else if (event === "SIGNED_OUT") {
        if (mounted) {
          setState({
            user: null,
            profile: null,
            role: "viewer",
            status: "pending",
            isLoading: false,
            sopCompanyIds: [],
          });
          router.replace("/login");
        }
      } else if (event === "PASSWORD_RECOVERY") {
        if (mounted) {
          router.replace("/login/reset-password");
        }
      } else if (event === "TOKEN_REFRESHED" && session?.user && mounted) {
        setState((s) => ({ ...s, user: session.user }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, router]);

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

  return { ...state, signInWithMicrosoft, signOut };
}
