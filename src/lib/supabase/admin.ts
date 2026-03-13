import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase admin credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)')
  }

  // No generic type: uses any, which is intentional for admin/service-role operations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
