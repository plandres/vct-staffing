import { describe, it, expect } from "vitest";
import {
  hexToWorkload,
  workloadCellClass,
  statusBadgeClass,
  WORKLOAD_COLORS,
  STATUS_COLORS,
  type WorkloadLevel,
  type AssignmentStatus,
} from "@/lib/utils/colors";

describe("hexToWorkload", () => {
  it("maps primary heavy green to 'heavy'", () => {
    expect(hexToWorkload("#0E632A")).toBe("heavy");
    expect(hexToWorkload("0E632A")).toBe("heavy");
  });

  it("maps alternate heavy green to 'heavy'", () => {
    expect(hexToWorkload("#3C7D22")).toBe("heavy");
    expect(hexToWorkload("3c7d22")).toBe("heavy"); // lowercase
  });

  it("maps light green to 'light'", () => {
    expect(hexToWorkload("#92D050")).toBe("light");
    expect(hexToWorkload("92d050")).toBe("light");
  });

  it("maps light blue to 'none'", () => {
    expect(hexToWorkload("#DAE9F8")).toBe("none");
  });

  it("returns 'none' for unknown hex values", () => {
    expect(hexToWorkload("#FF0000")).toBe("none");
    expect(hexToWorkload("FFFFFF")).toBe("none");
    expect(hexToWorkload("")).toBe("none");
  });
});

describe("workloadCellClass", () => {
  it("returns correct class for heavy", () => {
    const cls = workloadCellClass("heavy");
    expect(cls).toContain("bg-workload-heavy");
    expect(cls).toContain("text-white");
  });

  it("returns correct class for light", () => {
    const cls = workloadCellClass("light");
    expect(cls).toContain("bg-workload-light");
    expect(cls).toContain("text-black");
  });

  it("returns correct class for none", () => {
    const cls = workloadCellClass("none");
    expect(cls).toContain("bg-workload-none");
    expect(cls).toContain("text-black");
  });

  it("covers all WorkloadLevel values", () => {
    const levels: WorkloadLevel[] = ["heavy", "light", "none"];
    levels.forEach((level) => {
      expect(() => workloadCellClass(level)).not.toThrow();
    });
  });
});

describe("statusBadgeClass", () => {
  it("returns correct class for to_start", () => {
    const cls = statusBadgeClass("to_start");
    expect(cls).toContain("text-white");
  });

  it("returns correct class for ongoing", () => {
    const cls = statusBadgeClass("ongoing");
    expect(cls).toContain("text-white");
  });

  it("returns correct class for completed", () => {
    const cls = statusBadgeClass("completed");
    expect(cls).toContain("text-white");
  });

  it("returns correct class for roadblock", () => {
    const cls = statusBadgeClass("roadblock");
    expect(cls).toContain("text-white");
  });

  it("covers all AssignmentStatus values", () => {
    const statuses: AssignmentStatus[] = ["to_start", "ongoing", "completed", "roadblock"];
    statuses.forEach((status) => {
      expect(() => statusBadgeClass(status)).not.toThrow();
    });
  });
});

describe("WORKLOAD_COLORS", () => {
  it("has entries for all workload levels", () => {
    const levels: WorkloadLevel[] = ["heavy", "light", "none"];
    levels.forEach((level) => {
      expect(WORKLOAD_COLORS[level]).toBeDefined();
      expect(WORKLOAD_COLORS[level].bg).toBeTruthy();
      expect(WORKLOAD_COLORS[level].label).toBeTruthy();
    });
  });
});

describe("STATUS_COLORS", () => {
  it("has entries for all assignment statuses", () => {
    const statuses: AssignmentStatus[] = ["to_start", "ongoing", "completed", "roadblock"];
    statuses.forEach((status) => {
      expect(STATUS_COLORS[status]).toBeDefined();
      expect(STATUS_COLORS[status].bg).toBeTruthy();
      expect(STATUS_COLORS[status].label).toBeTruthy();
    });
  });
});
