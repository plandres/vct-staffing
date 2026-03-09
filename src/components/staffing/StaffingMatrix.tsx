"use client";

import { useMemo } from "react";
import type {
  StaffingAssignment,
  Profile,
  PortfolioCompany,
  ProgramCategory,
  Fund,
} from "@/types/database";
import { StaffingCell } from "./StaffingCell";

interface StaffingMatrixProps {
  assignments: StaffingAssignment[];
  members: Profile[];
  companies: PortfolioCompany[];
  programs: ProgramCategory[];
  funds: Fund[];
  isLoading: boolean;
  filterFundId?: string;
  filterProgramId?: string;
  filterMemberId?: string;
  upsertAssignment: (
    assignment: Partial<StaffingAssignment> & {
      member_id: string;
      company_id: string;
      program_id: string;
    }
  ) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
}

export function StaffingMatrix({
  assignments,
  members,
  companies,
  programs,
  funds,
  isLoading,
  filterFundId,
  filterProgramId,
  filterMemberId,
  upsertAssignment,
  deleteAssignment,
}: StaffingMatrixProps) {
  // Filter members
  const filteredMembers = useMemo(() => {
    if (filterMemberId) return members.filter((m) => m.id === filterMemberId);
    return members;
  }, [members, filterMemberId]);

  // Group companies by fund
  const companiesByFund = useMemo(() => {
    const sorted = funds
      .map((fund) => ({
        fund,
        companies: companies
          .filter((c) => c.fund_id === fund.id && c.status === "active")
          .filter((c) => !filterFundId || c.fund_id === filterFundId),
      }))
      .filter((g) => g.companies.length > 0);
    return sorted;
  }, [companies, funds, filterFundId]);

  // Build lookup: company_id + member_id → assignments[]
  const assignmentMap = useMemo(() => {
    const map = new Map<string, StaffingAssignment[]>();
    assignments.forEach((a) => {
      if (filterProgramId && a.program_id !== filterProgramId) return;
      const key = `${a.company_id}:${a.member_id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [assignments, filterProgramId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (filteredMembers.length === 0 || companiesByFund.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">
          No data matches the current filters
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-max">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            <th className="sticky left-0 z-20 bg-card border-b border-r border-border px-4 py-3 text-left font-medium text-muted-foreground w-40">
              Company
            </th>
            {filteredMembers.map((member) => (
              <th
                key={member.id}
                className="border-b border-r border-border px-2 py-3 text-center font-medium min-w-[80px]"
                title={member.full_name}
              >
                <div className="text-xs font-semibold">
                  {member.initials ?? member.full_name.slice(0, 3)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {companiesByFund.map(({ fund, companies: fundCompanies }) => (
            <>
              {/* Fund header row */}
              <tr key={`fund-${fund.id}`}>
                <td
                  colSpan={filteredMembers.length + 1}
                  className="bg-muted/50 border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {fund.name}
                </td>
              </tr>
              {/* Company rows */}
              {fundCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="sticky left-0 bg-card border-b border-r border-border px-4 py-2 font-medium">
                    <a
                      href={`/companies/${company.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {company.name}
                    </a>
                  </td>
                  {filteredMembers.map((member) => {
                    const cellAssignments =
                      assignmentMap.get(`${company.id}:${member.id}`) ?? [];
                    return (
                      <StaffingCell
                        key={`${company.id}:${member.id}`}
                        assignments={cellAssignments}
                        memberId={member.id}
                        companyId={company.id}
                        programs={programs}
                        onUpsert={upsertAssignment}
                        onDelete={deleteAssignment}
                      />
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
