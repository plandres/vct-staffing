"use client";

import { memo, useMemo } from "react";
import { Building2, Users, FolderKanban, Activity } from "lucide-react";
import type {
  StaffingAssignment,
  PortfolioCompany,
  Profile,
  ProgramCategory,
} from "@/types/database";

interface StatsCardsProps {
  assignments: StaffingAssignment[];
  companies: PortfolioCompany[];
  members: Profile[];
  programs: ProgramCategory[];
}

export const StatsCards = memo(function StatsCards({
  assignments,
  companies,
  members,
}: StatsCardsProps) {
  const stats = useMemo(() => {
    const activeCompanies = companies.filter((c) => c.status === "active");
    const activeAssignments = assignments.filter((a) => a.workload !== "none");
    const heavyCount = assignments.filter((a) => a.workload === "heavy").length;
    const ongoingPrograms = assignments.filter((a) => a.status === "ongoing").length;
    const toStartCount = assignments.filter((a) => a.status === "to_start").length;

    return [
      {
        label: "Active Companies",
        value: activeCompanies.length,
        icon: Building2,
        detail: `${companies.length} total`,
      },
      {
        label: "VCT Members",
        value: members.length,
        icon: Users,
        detail: `${heavyCount} heavy assignments`,
      },
      {
        label: "Active Assignments",
        value: activeAssignments.length,
        icon: Activity,
        detail: `${heavyCount} heavy, ${activeAssignments.length - heavyCount} light`,
      },
      {
        label: "Ongoing Programs",
        value: ongoingPrograms,
        icon: FolderKanban,
        detail: `${toStartCount} to start`,
      },
    ];
  }, [assignments, companies, members]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
});
