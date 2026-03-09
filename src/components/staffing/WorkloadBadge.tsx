"use client";

import type { WorkloadLevel } from "@/types/database";
import { WORKLOAD_COLORS } from "@/lib/utils/colors";

interface WorkloadBadgeProps {
  workload: WorkloadLevel;
  size?: "sm" | "md";
}

export function WorkloadBadge({ workload, size = "sm" }: WorkloadBadgeProps) {
  const config = WORKLOAD_COLORS[workload];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
