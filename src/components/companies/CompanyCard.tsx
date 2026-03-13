"use client";

import { useState } from "react";
import type {
  PortfolioCompany,
  Fund,
  StaffingAssignment,
  Profile,
  ProgramCategory,
  StrategicPriority,
  Kpi,
} from "@/types/database";
import { WorkloadBadge } from "@/components/staffing/WorkloadBadge";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { hasMinRole } from "@/lib/utils/roles";

interface CompanyCardProps {
  company: PortfolioCompany;
  fund: Fund | null;
  assignments: StaffingAssignment[];
  members: Profile[];
  programs: ProgramCategory[];
}

type Tab = "staffing" | "priorities" | "kpis";

export function CompanyCard({
  company: initialCompany,
  fund,
  assignments,
  members,
  programs,
}: CompanyCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("staffing");
  const [company, setCompany] = useState(initialCompany);
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = hasMinRole(role, "admin");

  // --- Priority form ---
  const [showPriorityForm, setShowPriorityForm] = useState(false);
  const [newPriority, setNewPriority] = useState("");
  const [newPriorityDesc, setNewPriorityDesc] = useState("");
  const [newPriorityStatus, setNewPriorityStatus] = useState<StrategicPriority["status"]>("active");

  // --- KPI form ---
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [newKpiName, setNewKpiName] = useState("");
  const [newKpiTarget, setNewKpiTarget] = useState("");
  const [newKpiCurrent, setNewKpiCurrent] = useState("");
  const [newKpiUnit, setNewKpiUnit] = useState("");

  const updateCompany = async (updates: Partial<PortfolioCompany>) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("portfolio_companies")
      .update(updates)
      .eq("id", company.id)
      .select()
      .single();
    if (error) {
      toast("Erreur lors de la mise à jour", "error");
      return false;
    }
    setCompany(data as PortfolioCompany);
    return true;
  };

  const handleAddPriority = async () => {
    if (!newPriority.trim()) return;
    const updated = [
      ...company.strategic_priorities,
      { priority: newPriority.trim(), description: newPriorityDesc.trim(), status: newPriorityStatus },
    ];
    const ok = await updateCompany({ strategic_priorities: updated } as Partial<PortfolioCompany>);
    if (ok) {
      toast("Priorité ajoutée");
      setNewPriority("");
      setNewPriorityDesc("");
      setNewPriorityStatus("active");
      setShowPriorityForm(false);
    }
  };

  const handleDeletePriority = async (index: number) => {
    const updated = company.strategic_priorities.filter((_, i) => i !== index);
    const ok = await updateCompany({ strategic_priorities: updated } as Partial<PortfolioCompany>);
    if (ok) toast("Priorité supprimée");
  };

  const handleTogglePriorityStatus = async (index: number) => {
    const updated = [...company.strategic_priorities];
    const current = updated[index].status;
    updated[index] = {
      ...updated[index],
      status: current === "active" ? "completed" : current === "completed" ? "on_hold" : "active",
    };
    const ok = await updateCompany({ strategic_priorities: updated } as Partial<PortfolioCompany>);
    if (ok) toast("Statut mis à jour");
  };

  const handleAddKpi = async () => {
    if (!newKpiName.trim()) return;
    const updated = [
      ...company.kpis,
      { name: newKpiName.trim(), target: newKpiTarget.trim(), current: newKpiCurrent.trim(), unit: newKpiUnit.trim() },
    ];
    const ok = await updateCompany({ kpis: updated } as Partial<PortfolioCompany>);
    if (ok) {
      toast("KPI ajouté");
      setNewKpiName("");
      setNewKpiTarget("");
      setNewKpiCurrent("");
      setNewKpiUnit("");
      setShowKpiForm(false);
    }
  };

  const handleDeleteKpi = async (index: number) => {
    const updated = company.kpis.filter((_, i) => i !== index);
    const ok = await updateCompany({ kpis: updated } as Partial<PortfolioCompany>);
    if (ok) toast("KPI supprimé");
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "staffing", label: "Staffing", count: assignments.length },
    { key: "priorities", label: "Priorités stratégiques", count: company.strategic_priorities.length },
    { key: "kpis", label: "KPIs", count: company.kpis.length },
  ];

  return (
    <div className="space-y-6">
      {/* Company header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{company.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {fund && <span>{fund.name}</span>}
              {company.sector && (
                <>
                  <span>|</span>
                  <span>{company.sector}</span>
                </>
              )}
              {company.geography && (
                <>
                  <span>|</span>
                  <span>{company.geography}</span>
                </>
              )}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              company.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {company.status}
          </span>
        </div>
        {company.deal_partner && (
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Deal Partner: </span>
              <span className="font-medium">{company.deal_partner}</span>
            </div>
            {company.deal_team.length > 0 && (
              <div>
                <span className="text-muted-foreground">Deal Team: </span>
                <span className="font-medium">
                  {company.deal_team.join(", ")}
                </span>
              </div>
            )}
          </div>
        )}
        {company.notes && (
          <p className="mt-3 text-sm text-muted-foreground">{company.notes}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "staffing" && (
        <div className="rounded-lg border border-border bg-card">
          {assignments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Aucune affectation VCT pour cette société
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Membre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Programme</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Charge</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Objectifs</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const member = members.find((m) => m.id === a.member_id);
                  const program = programs.find((p) => p.id === a.program_id);
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {member?.initials ?? "?"} — {member?.full_name ?? "Inconnu"}
                      </td>
                      <td className="px-4 py-3">{program?.name ?? "?"}</td>
                      <td className="px-4 py-3">
                        <WorkloadBadge workload={a.workload} />
                      </td>
                      <td className="px-4 py-3 capitalize">{a.status.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.objectives ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "priorities" && (
        <div className="rounded-lg border border-border bg-card p-6">
          {company.strategic_priorities.length === 0 && !showPriorityForm ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aucune priorité stratégique définie
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowPriorityForm(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une priorité
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {company.strategic_priorities.map((sp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md bg-muted/50 p-3"
                  >
                    <button
                      onClick={() => canEdit && handleTogglePriorityStatus(i)}
                      disabled={!canEdit}
                      className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        canEdit ? "cursor-pointer hover:opacity-80" : ""
                      } ${
                        sp.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : sp.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {sp.status === "active" ? "Actif" : sp.status === "completed" ? "Terminé" : "En pause"}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sp.priority}</p>
                      {sp.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{sp.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleDeletePriority(i)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {showPriorityForm ? (
                <div className="mt-4 space-y-2 rounded-md border p-3">
                  <input
                    type="text"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    placeholder="Priorité..."
                    className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="text"
                    value={newPriorityDesc}
                    onChange={(e) => setNewPriorityDesc(e.target.value)}
                    placeholder="Description (optionnel)..."
                    className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newPriorityStatus}
                      onChange={(e) => setNewPriorityStatus(e.target.value as StrategicPriority["status"])}
                      className="rounded-md border px-2 py-1.5 text-sm"
                    >
                      <option value="active">Actif</option>
                      <option value="on_hold">En pause</option>
                      <option value="completed">Terminé</option>
                    </select>
                    <div className="flex-1" />
                    <button
                      onClick={() => setShowPriorityForm(false)}
                      className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddPriority}
                      disabled={!newPriority.trim()}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ) : (
                canEdit && (
                  <button
                    onClick={() => setShowPriorityForm(true)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter une priorité
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "kpis" && (
        <div className="rounded-lg border border-border bg-card p-6">
          {company.kpis.length === 0 && !showKpiForm ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aucun KPI défini
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowKpiForm(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un KPI
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">KPI</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Cible</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Actuel</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Unité</th>
                    {canEdit && <th className="px-4 py-2 w-10" />}
                  </tr>
                </thead>
                <tbody>
                  {company.kpis.map((kpi, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium">{kpi.name}</td>
                      <td className="px-4 py-2">{kpi.target}</td>
                      <td className="px-4 py-2">{kpi.current}</td>
                      <td className="px-4 py-2 text-muted-foreground">{kpi.unit}</td>
                      {canEdit && (
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handleDeleteKpi(i)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {showKpiForm ? (
                <div className="mt-4 space-y-2 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newKpiName}
                      onChange={(e) => setNewKpiName(e.target.value)}
                      placeholder="Nom du KPI..."
                      className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={newKpiUnit}
                      onChange={(e) => setNewKpiUnit(e.target.value)}
                      placeholder="Unité (%, €, #...)"
                      className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={newKpiTarget}
                      onChange={(e) => setNewKpiTarget(e.target.value)}
                      placeholder="Cible"
                      className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="text"
                      value={newKpiCurrent}
                      onChange={(e) => setNewKpiCurrent(e.target.value)}
                      placeholder="Valeur actuelle"
                      className="rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowKpiForm(false)}
                      className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent rounded-md"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddKpi}
                      disabled={!newKpiName.trim()}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ) : (
                canEdit && (
                  <button
                    onClick={() => setShowKpiForm(true)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un KPI
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
