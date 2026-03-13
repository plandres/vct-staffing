# TODO — Mise en production Supabase & Vercel

Guide pas-à-pas pour quelqu'un qui n'est pas développeur.
Coche chaque étape une fois faite.

---

## PARTIE 1 : Supabase (la base de données + l'authentification)

### 1.1 — Créer le projet Supabase (si pas déjà fait)

- [ ] Va sur **https://supabase.com** → Sign In → New Project
- [ ] Choisis un nom (ex. `vct-staffing-prod`), un mot de passe DB fort, et la région `eu-west-1` (Europe)
- [ ] Attends que le projet soit prêt (~2 minutes)

### 1.2 — Récupérer tes clés

Une fois le projet créé, va dans **Settings > API** (menu gauche) :

- [ ] Copie l'**URL** du projet (ça ressemble à `https://abcdef.supabase.co`)
- [ ] Copie la **anon key** (clé publique, commence par `eyJ...`)
- [ ] Copie la **service_role key** (clé privée, commence aussi par `eyJ...`)

> **Garde ces 3 valeurs dans un endroit sûr** — tu en auras besoin pour Vercel.

### 1.3 — Exécuter les migrations (créer les tables)

Va dans **SQL Editor** (menu gauche de Supabase), puis exécute **chaque fichier** dans l'ordre :

- [ ] Copie-colle et exécute `supabase/migrations/001_initial_schema.sql`
- [ ] Copie-colle et exécute `supabase/migrations/002_rls_functions.sql`
- [ ] Copie-colle et exécute `supabase/migrations/003_rls_policies.sql`
- [ ] Copie-colle et exécute `supabase/migrations/004_indexes.sql`
- [ ] Copie-colle et exécute `supabase/migrations/005_seed_data.sql`
- [ ] Copie-colle et exécute `supabase/migrations/006_triggers.sql`
- [ ] Copie-colle et exécute `supabase/migrations/007_fix_profile_trigger_and_bootstrap.sql`

> **Important** : exécute-les dans l'ordre (001, 002, 003...). Si un script échoue, ne passe pas au suivant.

### 1.4 — Créer le premier admin

Toujours dans le **SQL Editor**, après avoir créé ton premier compte utilisateur :

- [ ] Exécute : `SELECT public.bootstrap_admin('ton.email@seven2.com');`
  (remplace par l'email du compte que tu vas utiliser pour te connecter)

> Ça te donne le rôle "owner" (accès complet). Les autres utilisateurs auront le rôle "viewer" par défaut.

### 1.5 — Configurer l'authentification Microsoft (SSO)

Va dans **Authentication > Providers** (menu gauche) :

- [ ] Active **Azure (Microsoft)**
- [ ] Renseigne les 3 champs (tu les obtiens dans Azure AD de ton organisation) :
  - **Client ID** : l'ID de l'application Azure AD
  - **Client Secret** : le secret de l'application
  - **Tenant URL** : `https://login.microsoftonline.com/TON_TENANT_ID/v2.0`
- [ ] Sauvegarde

### 1.6 — Configurer les URLs de redirection

Va dans **Authentication > URL Configuration** :

- [ ] **Site URL** : mets l'URL de ton site Vercel (ex. `https://vct-staffing.vercel.app`)
- [ ] **Redirect URLs** : ajoute `https://vct-staffing.vercel.app/auth/callback`

> C'est critique pour que la connexion Microsoft et le reset de mot de passe fonctionnent. Si l'URL est fausse, l'authentification échouera silencieusement.

### 1.7 — Configurer les emails (optionnel mais recommandé)

Par défaut Supabase envoie des emails génériques. Pour personnaliser :

Va dans **Authentication > Email Templates** :

- [ ] Personnalise le template **Reset Password** (ajoute le logo Seven2, ton texte)
- [ ] Personnalise le template **Confirm Signup** si tu utilises l'inscription email

Pour un SMTP custom (emails envoyés depuis votre domaine) :

Va dans **Project Settings > Auth** :

- [ ] Active **Custom SMTP**
- [ ] Renseigne : Host, Port, User, Password, Sender email
  (ex. via SendGrid, Resend, ou le SMTP de votre organisation)

---

## PARTIE 2 : Vercel (le déploiement du site)

### 2.1 — Connecter le repo GitHub

- [ ] Va sur **https://vercel.com** → Sign In avec GitHub
- [ ] Clique **Add New Project** → Import le repo `vct-staffing`
- [ ] Framework : **Next.js** (détecté automatiquement)

### 2.2 — Ajouter les variables d'environnement

**Avant de cliquer Deploy**, ajoute ces variables dans la section **Environment Variables** :

| Nom | Valeur | Où la trouver |
|-----|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdef.supabase.co` | Supabase > Settings > API > URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase > Settings > API > anon key |

- [ ] Ajoute `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Ajoute `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Vérifie que les 2 variables sont bien sur **Production** + **Preview** + **Development**

### 2.3 — Déployer

- [ ] Clique **Deploy**
- [ ] Attends la fin du build (~2-3 minutes)
- [ ] Vérifie que le build est **vert** (succès)

### 2.4 — Configurer le domaine custom (optionnel)

Si tu veux un domaine personnalisé (ex. `staffing.seven2.com`) :

- [ ] Va dans **Settings > Domains** sur Vercel
- [ ] Ajoute ton domaine
- [ ] Crée un enregistrement **CNAME** chez ton hébergeur DNS qui pointe vers `cname.vercel-dns.com`
- [ ] Si tu fais ça, **retourne dans Supabase** (étape 1.6) et mets à jour les URLs avec le nouveau domaine

---

## PARTIE 3 : Vérification finale

### Teste que tout fonctionne :

- [ ] Ouvre ton site Vercel → la page de login s'affiche
- [ ] Crée un compte avec email/mot de passe → tu arrives sur le dashboard
- [ ] Teste "Sign in with Microsoft" → la connexion SSO fonctionne
- [ ] Teste "Mot de passe oublié" → tu reçois un email de reset
- [ ] Va dans Admin > Users → tu te vois avec le rôle "owner"
- [ ] Va dans Admin > Config → les fonds et programmes sont affichés (données de seed)
- [ ] Ouvre la barre de recherche (Ctrl+K) → tu trouves des sociétés

---

## Résumé express

| Quoi | Où | Durée |
|------|----|-------|
| Créer projet + exécuter SQL | Supabase Dashboard | ~15 min |
| Configurer OAuth + URLs | Supabase Auth settings | ~10 min |
| Déployer + variables d'env | Vercel Dashboard | ~5 min |
| Tester | Ton navigateur | ~5 min |
