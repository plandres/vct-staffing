"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import { WorkloadBadge } from "@/components/staffing/WorkloadBadge";
import type { Profile, StaffingAssignment, PortfolioCompany, ProgramCategory, Fund } from "@/types/database";
import { User, Briefcase, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { WORKLOAD_COLORS } from "@/lib/utils/colors";

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.memberId as string;

  const [member, setMember] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<StaffingAssignment[]>([]);
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [programs, setPrograms] = useState<ProgramCategory[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [memberRes, assignRes, compRes, progRes, fundRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", memberId).single(),
      supabase.from("staffing_assignments").select("*").eq("member_id", memberId),
      supabase.from("portfolio_companies").select("*"),
      supabase.from("program_categories").select("*"),
      supabase.from("funds").select("*").order("display_order"),
    ]);

    if (memberRes.data) setMember(memberRes.data as Profile);
    if (assignRes.data) setAssignments(assignRes.data as StaffingAssignment[]);
    if (compRes.data) setCompanies(compRes.data as PortfolioCompany[]);
    if (progRes.data) setPrograms(progRes.data as ProgramCategory[]);
    if (fundRes.data) setFunds(fundRes.data as Fund[]);
    setLoading(false);
  }, [supabase, memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );
  const programMap = useMemo(
    () => new Map(programs.map((p) => [p.id, p])),
    [programs]
  );
  const fundMap = useMemo(
    () => new Map(funds.map((f) => [f.id, f])),
    [funds]
  );

  // Stats
  const heavyCount = assignments.filter((a) => a.workload === "heavy").length;
  const lightCount = assignments.filter((a) => a.workload === "light").length;
  const uniqueCompanies = new Set(assignments.map((a) => a.company_id)).size;
  const uniquePrograms = new Set(assignments.map((a) => a.program_id)).size;

  // Chart data: assignments by company
  const chartData = useMemo(() => {
    const map = new Map<string, { heavy: number; light: number; name: string }>();
    for (const a of assignments) {
      const company = companyMap.get(a.company_id);
      const name = company?.name ?? "?";
      const existing = map.get(a.company_id) ?? { heavy: 0, light: 0, name };
      if (a.workload === "heavy") existing.heavy++;
      else if (a.workload === "light") existing.light++;
      map.set(a.company_id, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.heavy + b.light - (a.heavy + a.light));
  }, [assignments, companyMap]);

  // Group assignments by company (grouped by fund)
  const assignmentsByFund = useMemo(() => {
    const result: { fund: Fund; entries: { company: PortfolioCompany; assignments: StaffingAssignment[] }[] }[] = [];
    const fundGroups = new Map<string, { company: PortfolioCompany; assignments: StaffingAssignment[] }[]>();

    for (const a of assignments) {
      const company = companyMap.get(a.company_id);
      if (!company) continue;
      const fundId = company.fund_id ?? "other";
      const group = fundGroups.get(fundId) ?? [];
      const companyEntry = group.find((g) => g.company.id === company.id);
      if (companyEntry) {
        companyEntry.assignments.push(a);
      } else {
        group.push({ company, assignments: [a] });
      }
      fundGroups.set(fundId, group);
    }

    for (const fund of funds) {
      const entries = fundGroups.get(fund.id);
      if (entries && entries.length > 0) {
        result.push({ fund, entries });
      }
    }

    return result;
  }, [assignments, companyMap, funds]);

  if (loading) {
    return (
      <AuthGuard requiredRole="viewer">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Chargement...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!member) {
    return (
      <AuthGuard requiredRole="viewer">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Membre introuvable</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="viewer">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title={member.full_name}
            description={`${member.initials ?? ""} — ${member.email}`}
            actions={
              <Link
                href="/staffing"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour matrice
              </Link>
            }
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Profile header */}
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {member.initials ?? member.full_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{member.full_name}</h2>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    {member.specialties && member.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {member.specialties.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        member.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          member.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      {member.is_active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Sociétés</span>
                  </div>
                  <p className="text-2xl font-bold">{uniqueCompanies}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Programmes</span>
                  </div>
                  <p className="text-2xl font-bold">{uniquePrograms}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: WORKLOAD_COLORS.heavy.bg }} />
                    <span className="text-xs text-gray-500">Heavy</span>
                  </div>
                  <p className="text-2xl font-bold">{heavyCount}</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-3 w-3 rounded" style={{ backgroundColor: WORKLOAD_COLORS.light.bg }} />
                    <span className="text-xs text-gray-500">Light</span>
                  </div>
                  <p className="text-2xl font-bold">{lightCount}</p>
                </div>
              </div>

              {/* Workload chart */}
              {chartData.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Charge par société
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={75}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar dataKey="heavy" stackId="a" fill={WORKLOAD_COLORS.heavy.bg} name="Heavy" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="light" stackId="a" fill={WORKLOAD_COLORS.light.bg} name="Light" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Assignments by fund */}
              {assignmentsByFund.map(({ fund, entries }) => (
                <div key={fund.id} className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <h3 className="text-sm font-semibold text-gray-700">{fund.name}</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Société
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Programme
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Charge
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Statut
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Objectifs
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-gray-600">
                          Ext. Resources
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {entries.map(({ company, assignments: compAssignments }) =>
                        compAssignments.map((a, i) => {
                          const prog = programMap.get(a.program_id);
                          return (
                            <tr key={a.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium">
                                {i === 0 ? (
                                  <Link
                                    href={`/companies/${company.id}`}
                                    className="hover:text-primary"
                                  >
                                    {company.name}
                                  </Link>
                                ) : (
                                  ""
                                )}
                              </td>
                              <td className="px-4 py-2 text-xs">
                                {prog?.name ?? "—"}
                              </td>
                              <td className="px-4 py-2">
                                <WorkloadBadge workload={a.workload} />
                              </td>
                              <td className="px-4 py-2 text-xs capitalize">
                                {a.status.replace("_", " ")}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500 max-w-[180px] truncate">
                                {a.objectives || "—"}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-500 max-w-[150px] truncate">
                                {a.external_resources || "—"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="bg-white border rounded-lg p-12 text-center">
                  <User className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">
                    Aucun assignment pour ce membre
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
