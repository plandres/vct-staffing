"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useToast } from "@/components/ui/Toast";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Fund, ProgramCategory, PortfolioCompany, CompanyStatus } from "@/types/database";
import { Plus, Trash2, GripVertical, Pencil, Check, X, Building2 } from "lucide-react";

function useDragReorder<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void
) {
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIdx.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIdx.current === null || overIdx === null || dragIdx.current === overIdx) {
      dragIdx.current = null;
      setOverIdx(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIdx.current, 1);
    reordered.splice(overIdx, 0, moved);
    dragIdx.current = null;
    setOverIdx(null);
    onReorder(reordered);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setOverIdx(null);
  };

  return { overIdx, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}

const STATUS_LABELS: Record<CompanyStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  exited: "Sortie",
};

const STATUS_COLORS: Record<CompanyStatus, string> = {
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  exited: "bg-red-50 text-red-600",
};

export default function AdminConfigPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [programs, setPrograms] = useState<ProgramCategory[]>([]);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Funds
  const [newFundName, setNewFundName] = useState("");

  // Programs
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramType, setNewProgramType] = useState<"fundamental" | "program">("program");

  // Companies
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyFund, setNewCompanyFund] = useState<string>("");
  const [newCompanyStatus, setNewCompanyStatus] = useState<CompanyStatus>("active");
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");

  const supabase = createBrowserClient();
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const [fundsRes, programsRes, companiesRes] = await Promise.all([
      supabase.from("funds").select("*").order("display_order"),
      supabase.from("program_categories").select("*").order("display_order"),
      supabase.from("portfolio_companies").select("*").order("name"),
    ]);
    if (fundsRes.data) setFunds(fundsRes.data as Fund[]);
    if (programsRes.data) setPrograms(programsRes.data as ProgramCategory[]);
    if (companiesRes.data) setCompanies(companiesRes.data as PortfolioCompany[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // --- Reorder handlers ---
  const saveOrder = async (table: string, items: { id: string }[]) => {
    const updates = items.map((item, i) =>
      supabase.from(table).update({ display_order: i }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast("Erreur lors de la sauvegarde de l'ordre", "error");
    } else {
      toast("Ordre mis à jour");
    }
  };

  const handleReorderFunds = (reordered: Fund[]) => {
    setFunds(reordered);
    saveOrder("funds", reordered);
  };

  const handleReorderPrograms = (reordered: ProgramCategory[]) => {
    setPrograms(reordered);
    saveOrder("program_categories", reordered);
  };

  // --- Funds CRUD ---
  const handleAddFund = async () => {
    if (!newFundName.trim()) return;
    const { data, error } = await supabase
      .from("funds")
      .insert({ name: newFundName.trim(), display_order: funds.length })
      .select()
      .single();

    if (data && !error) {
      setFunds((prev) => [...prev, data as Fund]);
      setNewFundName("");
      toast("Fonds ajouté");
    } else {
      toast("Erreur lors de l'ajout du fonds", "error");
    }
  };

  const handleDeleteFund = async (id: string) => {
    const { error } = await supabase.from("funds").delete().eq("id", id);
    if (!error) {
      setFunds((prev) => prev.filter((f) => f.id !== id));
      toast("Fonds supprimé");
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  };

  // --- Programs CRUD ---
  const handleAddProgram = async () => {
    if (!newProgramName.trim()) return;
    const { data, error } = await supabase
      .from("program_categories")
      .insert({
        name: newProgramName.trim(),
        type: newProgramType,
        display_order: programs.length,
      })
      .select()
      .single();

    if (data && !error) {
      setPrograms((prev) => [...prev, data as ProgramCategory]);
      setNewProgramName("");
      toast("Programme ajouté");
    } else {
      toast("Erreur lors de l'ajout du programme", "error");
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const { error } = await supabase
      .from("program_categories")
      .delete()
      .eq("id", id);
    if (!error) {
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      toast("Programme supprimé");
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  };

  // --- Companies CRUD ---
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    const { data, error } = await supabase
      .from("portfolio_companies")
      .insert({
        name: newCompanyName.trim(),
        fund_id: newCompanyFund || null,
        status: newCompanyStatus,
      })
      .select()
      .single();

    if (data && !error) {
      setCompanies((prev) => [...prev, data as PortfolioCompany].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCompanyName("");
      toast("Société ajoutée");
    } else {
      toast("Erreur lors de l'ajout de la société", "error");
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const { error } = await supabase.from("portfolio_companies").delete().eq("id", id);
    if (!error) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      toast("Société supprimée");
    } else {
      toast("Impossible de supprimer (assignments existants ?)", "error");
    }
  };

  const handleStartRename = (company: PortfolioCompany) => {
    setEditingCompanyId(company.id);
    setEditingCompanyName(company.name);
  };

  const handleConfirmRename = async (id: string) => {
    const trimmed = editingCompanyName.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("portfolio_companies")
      .update({ name: trimmed })
      .eq("id", id);
    if (!error) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast("Société renommée");
    } else {
      toast("Erreur lors du renommage", "error");
    }
    setEditingCompanyId(null);
  };

  const handleCancelRename = () => {
    setEditingCompanyId(null);
    setEditingCompanyName("");
  };

  const handleChangeCompanyFund = async (id: string, fundId: string) => {
    const { error } = await supabase
      .from("portfolio_companies")
      .update({ fund_id: fundId || null })
      .eq("id", id);
    if (!error) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, fund_id: fundId || null } : c))
      );
    } else {
      toast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleChangeCompanyStatus = async (id: string, status: CompanyStatus) => {
    const { error } = await supabase
      .from("portfolio_companies")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } else {
      toast("Erreur lors de la mise à jour", "error");
    }
  };

  const fundamentals = programs.filter((p) => p.type === "fundamental");
  const programsList = programs.filter((p) => p.type === "program");

  const fundsDrag = useDragReorder(funds, handleReorderFunds);

  const handleReorderFundamentals = (reordered: ProgramCategory[]) => {
    const newPrograms = [...reordered, ...programsList];
    handleReorderPrograms(newPrograms);
  };
  const handleReorderProgramsList = (reordered: ProgramCategory[]) => {
    const newPrograms = [...fundamentals, ...reordered];
    handleReorderPrograms(newPrograms);
  };

  const fundamentalsDrag = useDragReorder(fundamentals, handleReorderFundamentals);
  const programsListDrag = useDragReorder(programsList, handleReorderProgramsList);

  // Group companies by fund for display
  const companiesByFund = funds.map((fund) => ({
    fund,
    companies: companies.filter((c) => c.fund_id === fund.id),
  }));
  const unassignedCompanies = companies.filter((c) => !c.fund_id);

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Configuration"
            description="Gérez les fonds, sociétés, programmes et catégories"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {loading ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  Chargement...
                </div>
              ) : (
                <>
                  {/* Funds */}
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Fonds</h2>
                    <div className="space-y-1 mb-4">
                      {funds.map((fund, index) => (
                        <div
                          key={fund.id}
                          draggable
                          onDragStart={() => fundsDrag.handleDragStart(index)}
                          onDragOver={(e) => fundsDrag.handleDragOver(e, index)}
                          onDrop={fundsDrag.handleDrop}
                          onDragEnd={fundsDrag.handleDragEnd}
                          className={`flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-all ${
                            fundsDrag.overIdx === index ? "ring-2 ring-primary/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                            <span className="text-sm font-medium">{fund.name}</span>
                            <span className="text-xs text-gray-400">
                              {companies.filter((c) => c.fund_id === fund.id).length} sociétés
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteFund(fund.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFundName}
                        onChange={(e) => setNewFundName(e.target.value)}
                        placeholder="Nom du fonds..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => e.key === "Enter" && handleAddFund()}
                      />
                      <button
                        onClick={handleAddFund}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Companies */}
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="h-5 w-5 text-gray-400" />
                      <h2 className="text-lg font-semibold">Sociétés du portefeuille</h2>
                      <span className="text-xs text-gray-400 ml-1">{companies.length} au total</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Renommez en cliquant sur le crayon. Changez le fonds ou le statut via les menus.
                    </p>

                    <div className="space-y-4 mb-6">
                      {companiesByFund.map(({ fund, companies: fundCompanies }) => (
                        fundCompanies.length > 0 && (
                          <div key={fund.id}>
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">
                              {fund.name}
                            </div>
                            <div className="space-y-1">
                              {fundCompanies.map((company) => (
                                <CompanyRow
                                  key={company.id}
                                  company={company}
                                  funds={funds}
                                  isEditing={editingCompanyId === company.id}
                                  editingName={editingCompanyName}
                                  onEditingNameChange={setEditingCompanyName}
                                  onStartRename={handleStartRename}
                                  onConfirmRename={handleConfirmRename}
                                  onCancelRename={handleCancelRename}
                                  onChangeFund={handleChangeCompanyFund}
                                  onChangeStatus={handleChangeCompanyStatus}
                                  onDelete={handleDeleteCompany}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      ))}

                      {unassignedCompanies.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 px-1">
                            Sans fonds
                          </div>
                          <div className="space-y-1">
                            {unassignedCompanies.map((company) => (
                              <CompanyRow
                                key={company.id}
                                company={company}
                                funds={funds}
                                isEditing={editingCompanyId === company.id}
                                editingName={editingCompanyName}
                                onEditingNameChange={setEditingCompanyName}
                                onStartRename={handleStartRename}
                                onConfirmRename={handleConfirmRename}
                                onCancelRename={handleCancelRename}
                                onChangeFund={handleChangeCompanyFund}
                                onChangeStatus={handleChangeCompanyStatus}
                                onDelete={handleDeleteCompany}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add company form */}
                    <div className="border-t pt-4">
                      <div className="text-xs font-medium text-gray-500 mb-2">Ajouter une société</div>
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Nom de la société..."
                          className="flex-1 min-w-40 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onKeyDown={(e) => e.key === "Enter" && handleAddCompany()}
                        />
                        <select
                          value={newCompanyFund}
                          onChange={(e) => setNewCompanyFund(e.target.value)}
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Sans fonds</option>
                          {funds.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <select
                          value={newCompanyStatus}
                          onChange={(e) => setNewCompanyStatus(e.target.value as CompanyStatus)}
                          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="exited">Sortie</option>
                        </select>
                        <button
                          onClick={handleAddCompany}
                          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fundamentals */}
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-1">Fundamentals</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Catégories fondamentales appliquées à toutes les sociétés
                    </p>
                    <div className="space-y-1 mb-4">
                      {fundamentals.map((prog, index) => (
                        <div
                          key={prog.id}
                          draggable
                          onDragStart={() => fundamentalsDrag.handleDragStart(index)}
                          onDragOver={(e) => fundamentalsDrag.handleDragOver(e, index)}
                          onDrop={fundamentalsDrag.handleDrop}
                          onDragEnd={fundamentalsDrag.handleDragEnd}
                          className={`flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-all ${
                            fundamentalsDrag.overIdx === index ? "ring-2 ring-primary/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                            <span className="text-sm">{prog.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                              Fundamental
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Programs */}
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-1">Programmes</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Programmes spécifiques assignés par société
                    </p>
                    <div className="space-y-1 mb-4">
                      {programsList.map((prog, index) => (
                        <div
                          key={prog.id}
                          draggable
                          onDragStart={() => programsListDrag.handleDragStart(index)}
                          onDragOver={(e) => programsListDrag.handleDragOver(e, index)}
                          onDrop={programsListDrag.handleDrop}
                          onDragEnd={programsListDrag.handleDragEnd}
                          className={`flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg transition-all ${
                            programsListDrag.overIdx === index ? "ring-2 ring-primary/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                            <span className="text-sm">{prog.name}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProgramName}
                        onChange={(e) => setNewProgramName(e.target.value)}
                        placeholder="Nom du programme..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => e.key === "Enter" && handleAddProgram()}
                      />
                      <select
                        value={newProgramType}
                        onChange={(e) =>
                          setNewProgramType(e.target.value as "fundamental" | "program")
                        }
                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="program">Programme</option>
                        <option value="fundamental">Fundamental</option>
                      </select>
                      <button
                        onClick={handleAddProgram}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

// --- CompanyRow sub-component ---

interface CompanyRowProps {
  company: PortfolioCompany;
  funds: Fund[];
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (v: string) => void;
  onStartRename: (c: PortfolioCompany) => void;
  onConfirmRename: (id: string) => void;
  onCancelRename: () => void;
  onChangeFund: (id: string, fundId: string) => void;
  onChangeStatus: (id: string, status: CompanyStatus) => void;
  onDelete: (id: string) => void;
}

function CompanyRow({
  company,
  funds,
  isEditing,
  editingName,
  onEditingNameChange,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onChangeFund,
  onChangeStatus,
  onDelete,
}: CompanyRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group">
      {isEditing ? (
        <>
          <input
            autoFocus
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirmRename(company.id);
              if (e.key === "Escape") onCancelRename();
            }}
            className="flex-1 px-2 py-0.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button onClick={() => onConfirmRename(company.id)} className="p-1 text-green-600 hover:text-green-700">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={onCancelRename} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium truncate">{company.name}</span>

          <button
            onClick={() => onStartRename(company)}
            className="p-1 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          <select
            value={company.fund_id ?? ""}
            onChange={(e) => onChangeFund(company.id, e.target.value)}
            className="text-xs px-2 py-1 border rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Sans fonds</option>
            {funds.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={company.status}
            onChange={(e) => onChangeStatus(company.id, e.target.value as CompanyStatus)}
            className={`text-xs px-2 py-1 border-0 rounded font-medium focus:outline-none focus:ring-1 focus:ring-primary ${STATUS_COLORS[company.status]}`}
          >
            {(Object.keys(STATUS_LABELS) as CompanyStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <button
            onClick={() => onDelete(company.id)}
            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
