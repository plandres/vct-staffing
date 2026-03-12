# VCT Staffing Tracker — Seven2

Internal tool for managing Value Creation Team staffing assignments across portfolio companies.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + tailwindcss-animate + class-variance-authority
- **Backend**: Supabase (auth, database, SSR)
- **Charts**: Recharts
- **Tables**: TanStack React Table v8
- **Deployment**: Vercel
- **Parser**: Python service (`parser/`) for PDF/PPTX import (Docker)

## Project Structure

```
src/
  app/              # Next.js App Router pages
    admin/          # Admin pages (config, import, users)
    auth/           # OAuth callback route
    companies/      # Portfolio companies views
    dashboard/      # Main dashboard
    login/          # Auth pages (login, reset-password)
    programs/       # Programs management
    requests/       # Support requests
    staffing/       # Team staffing views
  components/       # Reusable UI components
    layout/         # Sidebar, Header, AuthGuard
    companies/      # Company-specific components
    dashboard/      # Dashboard widgets
    import/         # Import UI
    requests/       # Request components
    staffing/       # Staffing components
  lib/
    hooks/          # React hooks (useAuth, useCompanies, useStaffing)
    supabase/       # Supabase clients (client.ts, server.ts, middleware.ts)
    utils/          # Utility functions
  types/            # TypeScript types (database.ts)
middleware.ts       # Auth middleware (root level)
parser/             # Python PDF/PPTX parser service
supabase/           # Supabase config & migrations
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run db:gen-types` — Regenerate Supabase types (requires SUPABASE_PROJECT_ID)

## Environment Variables

Required in `.env.local` (local) and Vercel (production):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key

**Note**: Supabase clients use placeholder fallbacks during build/prerender to avoid build failures. The real env vars are required at runtime.

## Architecture Notes

- All pages are `"use client"` — data fetching happens client-side in `useEffect`/`useCallback`
- Auth is handled via Supabase SSR middleware (`middleware.ts` → `lib/supabase/middleware.ts`)
- Microsoft SSO (OAuth) + email/password login supported
- `AuthGuard` component wraps protected pages
- Path alias: `@/*` maps to `./src/*`
- Supabase migrations live in `supabase/migrations/`
