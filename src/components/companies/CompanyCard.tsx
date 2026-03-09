"use client";

import { useState } from "react";
import type {
  PortfolioCompany,
  Fund,
  StaffingAssignment,
  Profile,
  ProgramCategory,
} from "@/types/database";
import { WorkloadBadge } from "@/components/staffing/WorkloadBadge";

interface CompanyCardProps {
  company: PortfolioCompany;
  fund: Fund | null;
  assignments: StaffingAssignment[];
  members: Profile[];
  programs: ProgramCategory[];
}

type Tab = "staffing" | "priorities" | "kpis";

export function CompanyCard({
  company,
  fund,
  assignments,
  members,
  programs,
}: CompanyCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("staffing");

  const tabs: { key: Tab; label: string }[] = [
    { key: "staffing", label: "Active Staffing" },
    { key: "priorities", label: "Strategic Priorities" },
    { key: "kpis", label: "KPIs" },
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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "staffing" && (
        <div className="rounded-lg border border-border bg-card">
          {assignments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No VCT assignments for this company
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Workload
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Objectives
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const member = members.find((m) => m.id === a.member_id);
                  const program = programs.find((p) => p.id === a.program_id);
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {member?.initials ?? "?"} —{" "}
                        {member?.full_name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-3">{program?.name ?? "?"}</td>
                      <td className="px-4 py-3">
                        <WorkloadBadge workload={a.workload} />
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {a.status.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.objectives ?? "—"}
                      </td>
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
          {company.strategic_priorities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No strategic priorities defined. Upload an RDQM to populate.
            </p>
          ) : (
            <div className="space-y-3">
              {company.strategic_priorities.map((sp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-md bg-muted/50 p-3"
                >
                  <span
                    className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      sp.status === "active"
                        ? "bg-blue-100 text-blue-700"
                        : sp.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {sp.status}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{sp.priority}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "kpis" && (
        <div className="rounded-lg border border-border bg-card p-6">
          {company.kpis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No KPIs defined. Upload an RDQM to populate.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    KPI
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Target
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Current
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Unit
                  </th>
                </tr>
              </thead>
              <tbody>
                {company.kpis.map((kpi, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{kpi.name}</td>
                    <td className="px-4 py-2">{kpi.target}</td>
                    <td className="px-4 py-2">{kpi.current}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {kpi.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
