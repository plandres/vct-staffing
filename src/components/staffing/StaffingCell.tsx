"use client";

import { memo, useState, useMemo } from "react";
import type {
  StaffingAssignment,
  ProgramCategory,
  WorkloadLevel,
  AssignmentStatus,
} from "@/types/database";
import { WorkloadBadge } from "./WorkloadBadge";
import { workloadCellClass } from "@/lib/utils/colors";

interface StaffingCellProps {
  assignments: StaffingAssignment[];
  memberId: string;
  companyId: string;
  programs: ProgramCategory[];
  onUpsert: (
    assignment: Partial<StaffingAssignment> & {
      member_id: string;
      company_id: string;
      program_id: string;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const StaffingCell = memo(function StaffingCell({
  assignments,
  memberId,
  companyId,
  programs,
  onUpsert,
  onDelete,
}: StaffingCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    program_id: "",
    workload: "light" as WorkloadLevel,
    status: "to_start" as AssignmentStatus,
    objectives: "",
    external_resources: "",
  });

  const { dominantWorkload, programNames } = useMemo(() => {
    const dominant: WorkloadLevel =
      assignments.length === 0
        ? "none"
        : assignments.some((a) => a.workload === "heavy")
          ? "heavy"
          : assignments.filter((a) => a.workload === "light").length > 1
            ? "heavy" // Multiple Light = effective Heavy
            : "light";

    const names = assignments
      .map((a) => {
        const prog = programs.find((p) => p.id === a.program_id);
        return prog?.name ?? "?";
      })
      .join(", ");

    return { dominantWorkload: dominant, programNames: names };
  }, [assignments, programs]);

  const handleAdd = async () => {
    if (!editForm.program_id) return;
    try {
      await onUpsert({
        member_id: memberId,
        company_id: companyId,
        program_id: editForm.program_id,
        workload: editForm.workload,
        status: editForm.status,
        objectives: editForm.objectives || null,
        external_resources: editForm.external_resources || null,
      });
      setIsEditing(false);
      setEditForm({
        program_id: "",
        workload: "light",
        status: "to_start",
        objectives: "",
        external_resources: "",
      });
    } catch (err) {
      console.error("Failed to save assignment:", err);
    }
  };

  return (
    <td className="border-b border-r border-border p-0 relative">
      {/* Cell content */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-full min-h-[40px] px-2 py-1.5 text-xs text-center transition-colors cursor-pointer ${
          assignments.length > 0
            ? workloadCellClass(dominantWorkload)
            : "hover:bg-accent/50"
        }`}
      >
        {programNames || ""}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-30 top-full left-0 mt-1 w-72 rounded-lg border border-border bg-card shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Assignments</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Close
            </button>
          </div>

          {/* Existing assignments */}
          {assignments.length > 0 ? (
            <div className="space-y-2 mb-3">
              {assignments.map((a) => {
                const prog = programs.find((p) => p.id === a.program_id);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {prog?.name ?? "?"}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <WorkloadBadge workload={a.workload} />
                        <span className="text-xs text-muted-foreground">
                          {a.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDelete(a.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">
              No assignments
            </p>
          )}

          {/* Add assignment form */}
          {isEditing ? (
            <div className="space-y-2 border-t border-border pt-3">
              <select
                value={editForm.program_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, program_id: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Select program...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <select
                  value={editForm.workload}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      workload: e.target.value as WorkloadLevel,
                    })
                  }
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="heavy">Heavy</option>
                  <option value="light">Light</option>
                </select>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      status: e.target.value as AssignmentStatus,
                    })
                  }
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="to_start">To Start</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="roadblock">Roadblock</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Objectives..."
                value={editForm.objectives}
                onChange={(e) =>
                  setEditForm({ ...editForm, objectives: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                placeholder="External resources..."
                value={editForm.external_resources}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    external_resources: e.target.value,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!editForm.program_id}
                  className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              + Add assignment
            </button>
          )}
        </div>
      )}
    </td>
  );
});
