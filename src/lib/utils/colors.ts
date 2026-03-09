export type WorkloadLevel = "heavy" | "light" | "none";
export type AssignmentStatus = "to_start" | "ongoing" | "completed" | "roadblock";

// Workload level colors (from Seven2 PPTX standard)
export const WORKLOAD_COLORS: Record<WorkloadLevel, { bg: string; text: string; label: string }> = {
  heavy: { bg: "#0E632A", text: "#FFFFFF", label: "Heavy" },
  light: { bg: "#92D050", text: "#000000", label: "Light" },
  none: { bg: "#DAE9F8", text: "#000000", label: "No VCT" },
};

// Alternative heavy green (some slides use this)
export const HEAVY_ALT_HEX = "#3C7D22";

// Status colors
export const STATUS_COLORS: Record<AssignmentStatus, { bg: string; text: string; label: string }> = {
  to_start: { bg: "#FF6600", text: "#FFFFFF", label: "To Start" },
  ongoing: { bg: "#1CC853", text: "#FFFFFF", label: "Ongoing" },
  completed: { bg: "#00827D", text: "#FFFFFF", label: "Completed" },
  roadblock: { bg: "#DC2626", text: "#FFFFFF", label: "Roadblock" },
};

// PPTX hex → workload level mapping (used by RDQM parser)
export function hexToWorkload(hex: string): WorkloadLevel {
  const normalized = hex.toUpperCase().replace("#", "");
  switch (normalized) {
    case "0E632A":
    case "3C7D22":
      return "heavy";
    case "92D050":
      return "light";
    case "DAE9F8":
      return "none";
    default:
      return "none";
  }
}

// Tailwind class helpers for workload cells
export function workloadCellClass(workload: WorkloadLevel): string {
  switch (workload) {
    case "heavy":
      return "bg-workload-heavy text-white";
    case "light":
      return "bg-workload-light text-black";
    case "none":
      return "bg-workload-none text-black";
  }
}

export function statusBadgeClass(status: AssignmentStatus): string {
  switch (status) {
    case "to_start":
      return "bg-status-to-start text-white";
    case "ongoing":
      return "bg-status-ongoing text-white";
    case "completed":
      return "bg-status-completed text-white";
    case "roadblock":
      return "bg-red-600 text-white";
  }
}
