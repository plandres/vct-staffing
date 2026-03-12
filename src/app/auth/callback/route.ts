import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth provider errors (e.g. user denied consent)
  if (errorParam) {
    const message = errorDescription ?? errorParam;
    console.error("[auth/callback] OAuth error:", message);
    return NextResponse.redirect(
      `${origin}/login?error=access_denied`
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Verify session was actually created
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    console.error("[auth/callback] Session exchange failed:", error?.message);
  }

  // Auth error - redirect to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
