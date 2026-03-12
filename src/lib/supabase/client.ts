import { createBrowserClient } from "@supabase/ssr";

// Use placeholder values during build/prerender so the client can be created
// without crashing. Actual Supabase calls only happen client-side in useEffect.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Alias for components that import by this name
export { createClient as createBrowserClient };
