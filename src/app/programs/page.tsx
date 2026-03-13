"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import { WorkloadBadge } from "@/components/staffing/WorkloadBadge";
import type { ProgramCategory, StaffingAssignment, Profile, PortfolioCompany } from "@/types/database";
import { Layers, Briefcase } from "lucide-react";

interface ProgramWithStats extends ProgramCategory {
  assignmentCount: number;
  companies: string[];
  members: string[];
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramCategory[]>([]);
  const [assignments, setAssignments] = useState<StaffingAssignment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const supabaseRef = useRef(createBrowserClient());
  const supabase = supabaseRef.current;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [progsRes, assignRes, profilesRes, companiesRes] = await Promise.all([
      supabase.from("program_categories").select("*").order("type, display_order"),
      supabase.from("staffing_assignments").select("*"),
      supabase.from("profiles").select("*").eq("is_active", true),
      supabase.from("portfolio_companies").select("*").eq("status", "active"),
    ]);

    if (progsRes.data) setPrograms(progsRes.data as ProgramCategory[]);
    if (assignRes.data) setAssignments(assignRes.data as StaffingAssignment[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (companiesRes.data) setCompanies(companiesRes.data as PortfolioCompany[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles]
  );
  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );

  const programsWithStats: ProgramWithStats[] = useMemo(() => {
    return programs.map((prog) => {
      const progAssignments = assignments.filter((a) => a.program_id === prog.id);
      const companyNames = [
        ...new Set(
          progAssignments
            .map((a) => companyMap.get(a.company_id)?.name)
            .filter(Boolean) as string[]
        ),
      ];
      const memberNames = [
        ...new Set(
          progAssignments
            .map((a) => profileMap.get(a.member_id)?.initials)
            .filter(Boolean) as string[]
        ),
      ];
      return {
        ...prog,
        assignmentCount: progAssignments.length,
        companies: companyNames,
        members: memberNames,
      };
    });
  }, [programs, assignments, companyMap, profileMap]);

  const fundamentals = programsWithStats.filter((p) => p.type === "fundamental");
  const programsList = programsWithStats.filter((p) => p.type === "program");

  const selectedProgramData = selectedProgram
    ? programsWithStats.find((p) => p.id === selectedProgram)
    : null;

  const selectedAssignments = selectedProgram
    ? assignments.filter((a) => a.program_id === selectedProgram)
    : [];

  return (
    <AuthGuard requiredRole="viewer">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Programmes"
            description="Vue d'ensemble des programmes et fundamentals VCT"
          />
          <main className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-sm text-gray-500">
                Chargement...
              </div>
            ) : (
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Program list */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Fundamentals */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-blue-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Fundamentals</h2>
                    </div>
                    <div className="space-y-1.5">
                      {fundamentals.map((prog) => (
                        <button
                          key={prog.id}
                          onClick={() => setSelectedProgram(prog.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                            selectedProgram === prog.id
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{prog.name}</span>
                            <span className="text-xs text-gray-400">
                              {prog.assignmentCount} assign.
                            </span>
                          </div>
                          {prog.companies.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {prog.companies.slice(0, 3).join(", ")}
                              {prog.companies.length > 3 && ` +${prog.companies.length - 3}`}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Programs */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-green-600" />
                      <h2 className="text-sm font-semibold text-gray-700">Programmes</h2>
                    </div>
                    <div className="space-y-1.5">
                      {programsList.map((prog) => (
                        <button
                          key={prog.id}
                          onClick={() => setSelectedProgram(prog.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                            selectedProgram === prog.id
                              ? "bg-green-50 border-green-200"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{prog.name}</span>
                            <span className="text-xs text-gray-400">
                              {prog.assignmentCount} assign.
                            </span>
                          </div>
                          {prog.companies.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {prog.companies.slice(0, 3).join(", ")}
                              {prog.companies.length > 3 && ` +${prog.companies.length - 3}`}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detail panel */}
                <div className="lg:col-span-2">
                  {selectedProgramData ? (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            selectedProgramData.type === "fundamental"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {selectedProgramData.type === "fundamental"
                            ? "Fundamental"
                            : "Programme"}
                        </span>
                        <h2 className="text-lg font-semibold">
                          {selectedProgramData.name}
                        </h2>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Assignments</p>
                          <p className="text-xl font-bold">
                            {selectedProgramData.assignmentCount}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Sociétés</p>
                          <p className="text-xl font-bold">
                            {selectedProgramData.companies.length}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Membres</p>
                          <p className="text-xl font-bold">
                            {selectedProgramData.members.length}
                          </p>
                        </div>
                      </div>

                      {/* Members involved */}
                      {selectedProgramData.members.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Membres impliqués
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedProgramData.members.map((m) => (
                              <span
                                key={m}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assignments table */}
                      {selectedAssignments.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Détail des assignments
                          </h3>
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                                    Société
                                  </th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                                    Membre
                                  </th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                                    Charge
                                  </th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                                    Statut
                                  </th>
                                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                                    Objectifs
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {selectedAssignments.map((a) => {
                                  const company = companyMap.get(a.company_id);
                                  const member = profileMap.get(a.member_id);
                                  return (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-medium">
                                        {company?.name ?? "—"}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-xs">
                                        {member?.initials ?? "?"}
                                      </td>
                                      <td className="px-3 py-2">
                                        <WorkloadBadge workload={a.workload} />
                                      </td>
                                      <td className="px-3 py-2 text-xs capitalize">
                                        {a.status.replace("_", " ")}
                                      </td>
                                      <td className="px-3 py-2 text-xs text-gray-500 max-w-[200px] truncate">
                                        {a.objectives || "—"}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border rounded-lg p-12 text-center">
                      <Layers className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                      <p className="text-sm text-gray-500">
                        Sélectionnez un programme pour voir le détail
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
