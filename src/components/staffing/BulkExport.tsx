"use client";

import type {
  StaffingAssignment,
  Profile,
  PortfolioCompany,
  ProgramCategory,
  Fund,
} from "@/types/database";

interface BulkExportProps {
  assignments: StaffingAssignment[];
  members: Profile[];
  companies: PortfolioCompany[];
  programs: ProgramCategory[];
  funds: Fund[];
}

export function BulkExport({
  assignments,
  members,
  companies,
  programs,
  funds,
}: BulkExportProps) {
  const handleExport = () => {
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const programMap = new Map(programs.map((p) => [p.id, p]));
    const fundMap = new Map(funds.map((f) => [f.id, f]));

    const headers = [
      "initiales",
      "membre",
      "société",
      "fonds",
      "programme",
      "charge",
      "statut",
      "date_début",
      "date_fin",
      "objectifs",
      "ressources_externes",
      "notes",
    ];

    const rows = assignments.map((a) => {
      const member = memberMap.get(a.member_id);
      const company = companyMap.get(a.company_id);
      const program = programMap.get(a.program_id);
      const fund = company?.fund_id ? fundMap.get(company.fund_id) : undefined;

      return [
        member?.initials ?? "",
        member?.full_name ?? "",
        company?.name ?? "",
        fund?.name ?? "",
        program?.name ?? "",
        a.workload,
        a.status,
        a.start_date ?? "",
        a.end_date ?? "",
        a.objectives ?? "",
        a.external_resources ?? "",
        a.notes ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `staffing_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={assignments.length === 0}
      title={`Exporter ${assignments.length} assignment(s) en CSV`}
      className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exporter CSV
    </button>
  );
}
