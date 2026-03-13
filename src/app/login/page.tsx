"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  auth: "L'authentification a echoue. Veuillez reessayer.",
  session_expired: "Votre session a expire. Veuillez vous reconnecter.",
  access_denied: "Acces refuse.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createClient();

  // Show errors passed via URL (e.g. from auth callback)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(AUTH_ERROR_MESSAGES[errorParam] ?? "Une erreur est survenue.");
    }
  }, [searchParams]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/login/reset-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setInfo("Un email de reinitialisation a ete envoye. Verifiez votre boite de reception.");
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split("@")[0],
          },
        },
      });
      if (err) {
        setError(err.message);
      } else {
        // Try to sign in immediately after signup
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) {
          setInfo("Compte cree. Verifiez votre email ou reconnectez-vous.");
        } else {
          router.replace("/dashboard");
          return;
        }
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        if (err.message === "Invalid login credentials") {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError(err.message);
        }
      } else {
        router.replace("/dashboard");
        return;
      }
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm space-y-6 px-4">
      {/* Logo */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
          S2
        </div>
        <h1 className="mt-4 text-2xl font-semibold">VCT Staffing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seven2 Value Creation Team
        </p>
      </div>

      {mode === "forgot" ? (
        <>
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Saisissez votre email pour recevoir un lien de reinitialisation.
            </p>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "..." : "Envoyer le lien"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <button
              onClick={() => { setMode("login"); setError(null); setInfo(null); }}
              className="text-primary hover:underline"
            >
              Retour a la connexion
            </button>
          </p>
        </>
      ) : (
        <>
          {/* Email/Password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                minLength={6}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Se connecter"
                  : "Creer un compte"}
            </button>
          </form>

          <div className="space-y-2 text-center text-xs text-muted-foreground">
            {mode === "login" && (
              <p>
                <button
                  onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
                  className="text-primary hover:underline"
                >
                  Mot de passe oublie ?
                </button>
              </p>
            )}
            <p>
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(null); }}
                    className="text-primary hover:underline"
                  >
                    Creer un compte
                  </button>
                </>
              ) : (
                <>
                  Deja un compte ?{" "}
                  <button
                    onClick={() => { setMode("login"); setError(null); }}
                    className="text-primary hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
