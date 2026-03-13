"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { WORKLOAD_COLORS } from "@/lib/utils/colors";

interface ChartEntry {
  name: string;
  heavy: number;
  light: number;
}

export function MemberWorkloadChart({ data }: { data: ChartEntry[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
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
  );
}
