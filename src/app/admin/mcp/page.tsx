"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Copy, Check, Plug, BookOpen, Wrench, ShieldCheck } from "lucide-react";

const TOOLS = [
  { name: "get_stats", description: "Statistiques globales (users, sociétés, assignments, demandes)" },
  { name: "list_users", description: "Lister les utilisateurs (filter: role, status, is_active)" },
  { name: "get_user", description: "Détail d'un utilisateur par ID ou email" },
  { name: "approve_user", description: "Approuver un utilisateur en attente" },
  { name: "reject_user", description: "Rejeter un utilisateur" },
  { name: "update_user", description: "Modifier rôle, nom, spécialités, activation" },
  { name: "delete_user", description: "Supprimer un profil utilisateur" },
  { name: "list_funds", description: "Lister les fonds" },
  { name: "create_fund", description: "Créer un fonds" },
  { name: "update_fund", description: "Modifier un fonds" },
  { name: "delete_fund", description: "Supprimer un fonds" },
  { name: "list_companies", description: "Lister les sociétés (filter: fund, status)" },
  { name: "get_company", description: "Détail d'une société avec ses assignments" },
  { name: "create_company", description: "Ajouter une société au portfolio" },
  { name: "update_company", description: "Modifier une société" },
  { name: "delete_company", description: "Supprimer une société" },
  { name: "list_programs", description: "Lister les programmes / fondamentaux" },
  { name: "create_program", description: "Créer un programme ou fondamental" },
  { name: "update_program", description: "Modifier un programme" },
  { name: "delete_program", description: "Supprimer un programme" },
  { name: "list_staffing", description: "Lister les assignments (filter: member, company, program, workload)" },
  { name: "upsert_staffing", description: "Créer ou modifier un assignment" },
  { name: "delete_staffing", description: "Supprimer un assignment" },
  { name: "list_requests", description: "Lister les demandes de support (filter: status, priority)" },
  { name: "update_request", description: "Modifier une demande (statut, assignation)" },
  { name: "delete_request", description: "Supprimer une demande" },
  { name: "list_sop", description: "Lister les associations SOP ↔ société" },
  { name: "add_sop", description: "Assigner un SOP à une société" },
  { name: "remove_sop", description: "Retirer une association SOP" },
  { name: "get_activity", description: "Journal d'audit (filter: entity, user, action)" },
  { name: "get_settings", description: "Lire les paramètres de l'application" },
  { name: "update_setting", description: "Modifier un paramètre (ex: domaine email autorisé)" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <span className="text-xs text-muted-foreground font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto text-foreground leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export default function McpPage() {
  const sseUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/sse`
    : "https://votre-app.vercel.app/api/sse";

  const configJson = JSON.stringify(
    {
      mcpServers: {
        "vct-staffing": {
          type: "http",
          url: sseUrl,
          headers: { "x-api-key": "VOTRE_MCP_API_KEY" },
        },
      },
    },
    null,
    2
  );

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header title="MCP Server" description="Administrer l'app depuis Claude.ai" />
          <main className="flex-1 overflow-y-auto p-6 space-y-8">

            {/* Intro */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                  <Plug className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold mb-1">Qu'est-ce que le MCP Server ?</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Le serveur MCP (Model Context Protocol) est intégré à cette application et expose{" "}
                    <strong>{TOOLS.length} outils admin</strong> que tu peux utiliser directement depuis{" "}
                    <strong>Claude.ai</strong>. Une fois configuré, tu peux gérer utilisateurs, sociétés,
                    assignments et tout le reste en langage naturel, sans ouvrir l'interface.
                  </p>
                </div>
              </div>
            </div>

            {/* Setup steps */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Configuration
                </h2>
              </div>
              <div className="space-y-6">

                {/* Step 1 */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                    <h3 className="font-medium">Configurer les variables d'environnement</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ajoute ces deux variables dans les settings de ton projet Vercel{" "}
                    <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                      Settings → Environment Variables
                    </span>
                  </p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium mb-1 text-muted-foreground">
                        SUPABASE_SERVICE_ROLE_KEY
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Disponible dans le Dashboard Supabase →{" "}
                        <span className="font-mono bg-muted px-1 py-0.5 rounded">
                          Project Settings → API → service_role
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1 text-muted-foreground">MCP_API_KEY</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Une clé secrète de ton choix. Génère-en une avec :
                      </p>
                      <CodeBlock code="openssl rand -hex 32" language="bash" />
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                    <h3 className="font-medium">Ajouter le serveur MCP dans Claude.ai</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Dans Claude.ai, va dans{" "}
                    <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                      Settings → Integrations → Add MCP Server
                    </span>{" "}
                    et colle la configuration ci-dessous :
                  </p>
                  <CodeBlock code={configJson} language="json (Claude.ai MCP config)" />
                  <p className="text-xs text-muted-foreground mt-3">
                    Remplace <span className="font-mono bg-muted px-1 py-0.5 rounded">VOTRE_MCP_API_KEY</span>{" "}
                    par la valeur de ta variable <span className="font-mono bg-muted px-1 py-0.5 rounded">MCP_API_KEY</span>.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                    <h3 className="font-medium">Tester la connexion</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Une fois configuré, teste dans Claude.ai avec des phrases comme :
                  </p>
                  <div className="space-y-2">
                    {[
                      "Montre-moi les stats de l'app VCT",
                      "Liste les utilisateurs en attente d'approbation",
                      "Quelles sont les sociétés du fonds MM X ?",
                      "Quels assignments Heavy sont actifs cette semaine ?",
                    ].map((example) => (
                      <div
                        key={example}
                        className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground">›</span>
                        <span className="text-sm italic">{example}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Security note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Sécurité</p>
                  <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                    <li>Le MCP server bypasse les RLS Supabase — utilise uniquement avec la <strong>MCP_API_KEY</strong> configurée</li>
                    <li>Ne partage jamais ta <strong>MCP_API_KEY</strong> ni la <strong>SUPABASE_SERVICE_ROLE_KEY</strong></li>
                    <li>Le endpoint est disponible à <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">/api/sse</span> et <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">/api/mcp</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tools list */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {TOOLS.length} outils disponibles
                </h2>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Outil</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TOOLS.map((tool) => (
                      <tr key={tool.name} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground">
                            {tool.name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{tool.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
