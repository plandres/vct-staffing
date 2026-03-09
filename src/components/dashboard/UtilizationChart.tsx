"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { StaffingAssignment, Profile } from "@/types/database";

interface UtilizationChartProps {
  assignments: StaffingAssignment[];
  members: Profile[];
}

export function UtilizationChart({
  assignments,
  members,
}: UtilizationChartProps) {
  const data = members
    .map((member) => {
      const memberAssignments = assignments.filter(
        (a) => a.member_id === member.id
      );
      return {
        name: member.initials ?? member.full_name.slice(0, 3),
        heavy: memberAssignments.filter((a) => a.workload === "heavy").length,
        light: memberAssignments.filter((a) => a.workload === "light").length,
      };
    })
    .filter((d) => d.heavy > 0 || d.light > 0)
    .sort((a, b) => b.heavy + b.light - (a.heavy + a.light));

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-semibold mb-4">
        Team Utilization (by assignments)
      </h3>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No staffing data yet
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={40} fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="heavy"
              name="Heavy"
              fill="#0E632A"
              stackId="stack"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="light"
              name="Light"
              fill="#92D050"
              stackId="stack"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
