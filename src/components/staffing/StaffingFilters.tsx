"use client";

import type { Fund, ProgramCategory, Profile } from "@/types/database";

interface StaffingFiltersProps {
  funds: Fund[];
  programs: ProgramCategory[];
  members: Profile[];
  selectedFund?: string;
  selectedProgram?: string;
  selectedMember?: string;
  onFundChange: (value: string | undefined) => void;
  onProgramChange: (value: string | undefined) => void;
  onMemberChange: (value: string | undefined) => void;
}

export function StaffingFilters({
  funds,
  programs,
  members,
  selectedFund,
  selectedProgram,
  selectedMember,
  onFundChange,
  onProgramChange,
  onMemberChange,
}: StaffingFiltersProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-6 py-3">
      {/* Fund filter */}
      <select
        value={selectedFund ?? ""}
        onChange={(e) => onFundChange(e.target.value || undefined)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Funds</option>
        {funds.map((fund) => (
          <option key={fund.id} value={fund.id}>
            {fund.name}
          </option>
        ))}
      </select>

      {/* Program filter */}
      <select
        value={selectedProgram ?? ""}
        onChange={(e) => onProgramChange(e.target.value || undefined)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Programs</option>
        <optgroup label="Fundamentals">
          {programs
            .filter((p) => p.type === "fundamental")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </optgroup>
        <optgroup label="Programs">
          {programs
            .filter((p) => p.type === "program")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </optgroup>
      </select>

      {/* Member filter */}
      <select
        value={selectedMember ?? ""}
        onChange={(e) => onMemberChange(e.target.value || undefined)}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
      >
        <option value="">All Members</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.initials ?? m.full_name} — {m.full_name}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {(selectedFund || selectedProgram || selectedMember) && (
        <button
          onClick={() => {
            onFundChange(undefined);
            onProgramChange(undefined);
            onMemberChange(undefined);
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
