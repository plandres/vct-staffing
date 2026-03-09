"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Fund, ProgramCategory } from "@/types/database";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";

export default function AdminConfigPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [programs, setPrograms] = useState<ProgramCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFundName, setNewFundName] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [newProgramType, setNewProgramType] = useState<"fundamental" | "program">("program");

  const supabase = createBrowserClient();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    const [fundsRes, programsRes] = await Promise.all([
      supabase.from("funds").select("*").order("display_order"),
      supabase.from("program_categories").select("*").order("display_order"),
    ]);
    if (fundsRes.data) setFunds(fundsRes.data as Fund[]);
    if (programsRes.data) setPrograms(programsRes.data as ProgramCategory[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

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
    }
  };

  const handleDeleteFund = async (id: string) => {
    const { error } = await supabase.from("funds").delete().eq("id", id);
    if (!error) {
      setFunds((prev) => prev.filter((f) => f.id !== id));
    }
  };

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
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const { error } = await supabase
      .from("program_categories")
      .delete()
      .eq("id", id);
    if (!error) {
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const fundamentals = programs.filter((p) => p.type === "fundamental");
  const programsList = programs.filter((p) => p.type === "program");

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Configuration"
            description="Gérez les fonds, programmes et catégories"
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
                    <div className="space-y-2 mb-4">
                      {funds.map((fund) => (
                        <div
                          key={fund.id}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-300" />
                            <span className="text-sm font-medium">{fund.name}</span>
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

                  {/* Fundamentals */}
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-1">Fundamentals</h2>
                    <p className="text-xs text-gray-500 mb-4">
                      Catégories fondamentales appliquées à toutes les sociétés
                    </p>
                    <div className="space-y-2 mb-4">
                      {fundamentals.map((prog) => (
                        <div
                          key={prog.id}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-300" />
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
                    <div className="space-y-2 mb-4">
                      {programsList.map((prog) => (
                        <div
                          key={prog.id}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-gray-300" />
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
