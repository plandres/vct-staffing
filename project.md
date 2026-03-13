# VCT Staffing — Project Status

> Ce fichier est mis à jour à chaque PR. Dernière mise à jour : 2026-03-13

---

## Supabase

### Fait

- [x] Schéma complet : 9 tables avec RLS (7 migrations 001→007)
- [x] Fonctions RLS : `get_user_role`, `is_admin_or_owner`, `is_authenticated_active`, `sop_company_ids`, etc.
- [x] Politiques RLS fines sur toutes les tables (SELECT/INSERT/UPDATE/DELETE par rôle)
- [x] Index de performance sur colonnes critiques (staffing, profiles, companies, requests, activity_log)
- [x] Triggers : `handle_new_user` (auto-création profil), `update_updated_at`, `log_staffing_change`
- [x] Fonction `bootstrap_admin()` pour promouvoir le 1er utilisateur
- [x] Seed data : 3 fonds, 26 sociétés, 16 catégories de programmes
- [x] 3 clients Supabase (client, server, middleware) avec placeholder fallbacks
- [x] Auth middleware SSR avec `getUser()` + routing public/privé
- [x] `useAuth` optimisé : `getSession()` au lieu de `getUser()` pour le chargement initial (perf)
- [x] Auth flow : Microsoft OAuth (Azure) + email/password + reset password + callback
- [x] Realtime : subscription sur `staffing_assignments`
- [x] Fix re-render infini dans `useStaffing` / `useCompanies` (dépendances `useCallback` stabilisées)
- [x] Types TypeScript complets (`src/types/database.ts`)
- [x] `config.toml` local avec Azure OAuth, Studio, Realtime
- [x] `.env.local` avec credentials dev

### À faire

- [x] **Migrations exécutées sur la DB de prod** — 9 tables, 10 fonctions, 27 policies RLS, 22 index, 7 triggers, seed data (3 fonds, 16 programmes) — via MCP Supabase
- [x] Migration 008 : policies RLS granulaires sur `funds` et `program_categories` (INSERT/UPDATE/DELETE séparés avec `WITH CHECK`)
- [x] **`bootstrap_admin()` exécuté** — paul-louis.andres@seven2.eu promu owner
- [ ] Configurer `SUPABASE_SERVICE_ROLE_KEY` (pour opérations admin server-side)
- [x] Ajouter `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` dans `.env.example`
- [ ] Configurer SMTP custom pour les emails (reset password, invitations)
- [ ] Créer des templates email personnalisés (branding Seven2)
- [x] Étendre l'activity logging au-delà de `staffing_assignments` : triggers sur `portfolio_companies`, `profiles`, `support_requests` (migration 009)
- [x] Migration 010 : `ALTER PUBLICATION supabase_realtime ADD TABLE staffing_assignments` (Postgres Changes sans erreur)
- [x] Migration 011 : table `app_settings` (domaine email configurable), colonne `status` sur `profiles` (pending/approved/rejected), trigger `handle_new_user` mis à jour (vérification domaine + compte pending/inactive), policy `profiles_select` corrigée (lecture du propre profil même en pending)
- [ ] Automatiser la sync des types (`database.ts` actuellement manuel → risque de drift)
- [ ] Configurer l'URL de callback OAuth en production (actuellement `localhost:3000`)
- [ ] Ajouter du rate limiting sur les endpoints auth

---

## Vercel

### Fait

- [x] `next.config.ts` configuré (Server Actions, 10MB body limit)
- [x] Scripts de build prêts (`build`, `dev`, `lint`, `db:gen-types`)
- [x] Placeholder fallbacks dans les clients Supabase (pas de crash au build)
- [x] Middleware compatible Edge Runtime
- [x] Tailwind + PostCSS configurés
- [x] TypeScript strict mode
- [x] `.gitignore` correct (`.env.local`, `.next/`, `node_modules/`)

### À faire

- [x] Créer `vercel.json` (framework Next.js, build/install commands)
- [x] Créer `.vercelignore` pour exclure `parser/`, `supabase/`, `TODO_SETUP.md`, `project.md`
- [x] Ajouter les variables d'env sur le Dashboard Vercel (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Configurer les variables Azure OAuth dans Supabase Dashboard (prod)

---

## Application

### Fait

- [x] Dashboard avec stats et graphiques (Recharts)
- [x] Matrice de staffing avec filtrage par fonds/programme/membre
- [x] Vue détail société (`companies/[companyId]`)
- [x] Vue détail membre (`staffing/[memberId]`) avec graphique de charge
- [x] Gestion des programmes et fondamentaux
- [x] Tableau de bord des demandes de support (request board)
- [x] Admin : gestion des utilisateurs (rôles, activation)
- [x] Admin : configuration des fonds et programmes
- [x] Admin : import RDQM (PDF/PPTX → parse → preview → upsert)
- [x] Sidebar avec navigation par rôle
- [x] AuthGuard avec contrôle d'accès par rôle
- [x] Système de rôles à 6 niveaux (owner→viewer)
- [x] UI en français
- [x] Système de toasts/notifications (`ToastProvider` + `useToast`)
- [x] Drag & drop sur la config fonds/programmes (HTML5 natif, sauvegarde `display_order`)
- [x] Édition de profil utilisateur (modale depuis la sidebar : nom, initiales, téléphone, spécialités)
- [x] Priorités stratégiques & KPIs éditables dans la fiche société (ajout, suppression, toggle statut)
- [x] Recherche globale (Ctrl+K) : sociétés, membres, programmes avec navigation clavier
- [x] Gestion des sociétés du portefeuille dans Admin > Config (ajout, renommage inline, changement fonds/statut, suppression)

### À faire

- [x] Opérations en masse (bulk import/export d'assignments) — `BulkExport` + `BulkImport` CSV dans la barre de filtres
- [x] Tests automatisés : Vitest + React Testing Library configurés, 49 tests unitaires (utils roles, colors)
- [x] Flux d'approbation utilisateur : écrans pending/rejected dans `AuthGuard`, section approbations dans Admin > Utilisateurs (boutons Approuver/Rejeter), section "Accès & Sécurité" dans Admin > Config (domaine email autorisé)
- [x] Login : suppression de l'auto-connexion après inscription, message clair sur vérification email + approbation admin, affichage de l'erreur de domaine depuis le trigger Supabase

---

## Parser (Python)

### Fait

- [x] Service Docker pour import PDF/PPTX

### À faire

- [ ] Documentation du service parser
- [ ] Tests du parser
