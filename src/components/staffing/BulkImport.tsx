"use client";

import { useState, useRef } from "react";
import type {
  StaffingAssignment,
  Profile,
  PortfolioCompany,
  ProgramCategory,
  WorkloadLevel,
  AssignmentStatus,
} from "@/types/database";

interface ParsedRow {
  rowIndex: number;
  raw: Record<string, string>;
  member?: Profile;
  company?: PortfolioCompany;
  program?: ProgramCategory;
  assignment: Partial<StaffingAssignment>;
  isNew: boolean;
  errors: string[];
}

interface BulkImportProps {
  assignments: StaffingAssignment[];
  members: Profile[];
  companies: PortfolioCompany[];
  programs: ProgramCategory[];
  upsertAssignment: (
    a: Partial<StaffingAssignment> & {
      member_id: string;
      company_id: string;
      program_id: string;
    }
  ) => Promise<void>;
  onDone: () => void;
}

const VALID_WORKLOADS: WorkloadLevel[] = ["heavy", "light", "none"];
const VALID_STATUSES: AssignmentStatus[] = [
  "to_start",
  "ongoing",
  "completed",
  "roadblock",
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) =>
    h.trim().replace(/^"|"$/g, "").toLowerCase()
  );

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

export function BulkImport({
  assignments,
  members,
  companies,
  programs,
  upsertAssignment,
  onDone,
}: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingMap = new Map(
    assignments.map((a) => [`${a.member_id}:${a.company_id}:${a.program_id}`, a])
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rawRows = parseCSV(text);
      const parsed = rawRows
        .filter((r) => Object.values(r).some((v) => v !== ""))
        .map((raw, idx) => parseRow(raw, idx + 2));
      setRows(parsed);
      setDone(false);
    };
    reader.readAsText(file, "UTF-8");
  };

  const parseRow = (raw: Record<string, string>, rowIndex: number): ParsedRow => {
    const errors: string[] = [];

    // Match member by initiales or membre
    const memberKey = (raw["initiales"] || raw["membre"] || "").toLowerCase();
    const member = members.find(
      (m) =>
        (m.initials?.toLowerCase() === memberKey) ||
        m.full_name.toLowerCase() === memberKey
    );
    if (!member) errors.push(`Membre introuvable : "${raw["initiales"] || raw["membre"]}"`);

    // Match company by name
    const companyKey = (raw["société"] || raw["societe"] || raw["company"] || "").toLowerCase();
    const company = companies.find(
      (c) => c.name.toLowerCase() === companyKey
    );
    if (!company) errors.push(`Société introuvable : "${raw["société"] || raw["company"]}"`);

    // Match program by name
    const programKey = (raw["programme"] || raw["program"] || "").toLowerCase();
    const program = programs.find(
      (p) => p.name.toLowerCase() === programKey
    );
    if (!program) errors.push(`Programme introuvable : "${raw["programme"] || raw["program"]}"`);

    // Workload
    const workloadRaw = (raw["charge"] || raw["workload"] || "none").toLowerCase() as WorkloadLevel;
    const workload = VALID_WORKLOADS.includes(workloadRaw) ? workloadRaw : "none";

    // Status
    const statusRaw = (raw["statut"] || raw["status"] || "to_start").toLowerCase() as AssignmentStatus;
    const status = VALID_STATUSES.includes(statusRaw) ? statusRaw : "to_start";

    const assignment: Partial<StaffingAssignment> = {
      member_id: member?.id,
      company_id: company?.id,
      program_id: program?.id,
      workload,
      status,
      start_date: raw["date_début"] || raw["start_date"] || null,
      end_date: raw["date_fin"] || raw["end_date"] || null,
      objectives: raw["objectifs"] || raw["objectives"] || null,
      external_resources: raw["ressources_externes"] || raw["external_resources"] || null,
      notes: raw["notes"] || null,
    };

    const isNew =
      member && company && program
        ? !existingMap.has(`${member.id}:${company.id}:${program.id}`)
        : true;

    return { rowIndex, raw, member, company, program, assignment, isNew, errors };
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const errorRows = rows.filter((r) => r.errors.length > 0);
  const newRows = validRows.filter((r) => r.isNew);
  const updateRows = validRows.filter((r) => !r.isNew);

  const handleApply = async () => {
    setApplying(true);
    setProgress({ done: 0, total: validRows.length });
    let done = 0;
    for (const row of validRows) {
      try {
        await upsertAssignment(
          row.assignment as Parameters<typeof upsertAssignment>[0]
        );
      } catch {
        // continue on individual errors
      }
      done++;
      setProgress({ done, total: validRows.length });
    }
    setApplying(false);
    setDone(true);
    onDone();
  };

  const handleClose = () => {
    setOpen(false);
    setRows([]);
    setDone(false);
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors"
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
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Importer CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold">Importer des assignments (CSV)</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-4">
              {/* File input */}
              <div>
                <label className="text-sm text-muted-foreground block mb-2">
                  Fichier CSV (format export de cette application)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFile}
                  className="text-sm"
                />
              </div>

              {/* Format hint */}
              {rows.length === 0 && (
                <div className="rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">Colonnes attendues :</p>
                  <p className="font-mono">initiales, membre, société, fonds, programme, charge, statut, date_début, date_fin, objectifs, ressources_externes, notes</p>
                  <p className="mt-1">Valeurs valides — <strong>charge</strong> : heavy / light / none &nbsp;|&nbsp; <strong>statut</strong> : to_start / ongoing / completed / roadblock</p>
                  <p>Utilisez l'export CSV pour obtenir un fichier au bon format.</p>
                </div>
              )}

              {/* Preview */}
              {rows.length > 0 && !done && (
                <div className="space-y-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">{newRows.length} nouveaux</span>
                    <span className="text-blue-600 font-medium">{updateRows.length} mises à jour</span>
                    {errorRows.length > 0 && (
                      <span className="text-destructive font-medium">{errorRows.length} erreurs (ignorées)</span>
                    )}
                  </div>

                  {/* Valid rows */}
                  {validRows.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Lignes valides ({validRows.length})</p>
                      <div className="border border-border rounded-md overflow-auto max-h-48">
                        <table className="text-xs w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium">Statut</th>
                              <th className="px-2 py-1.5 text-left font-medium">Membre</th>
                              <th className="px-2 py-1.5 text-left font-medium">Société</th>
                              <th className="px-2 py-1.5 text-left font-medium">Programme</th>
                              <th className="px-2 py-1.5 text-left font-medium">Charge</th>
                              <th className="px-2 py-1.5 text-left font-medium">Statut assign.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validRows.map((row) => (
                              <tr key={row.rowIndex} className="border-t border-border">
                                <td className="px-2 py-1">
                                  {row.isNew ? (
                                    <span className="text-green-600">+ nouveau</span>
                                  ) : (
                                    <span className="text-blue-600">~ màj</span>
                                  )}
                                </td>
                                <td className="px-2 py-1">{row.member?.initials} — {row.member?.full_name}</td>
                                <td className="px-2 py-1">{row.company?.name}</td>
                                <td className="px-2 py-1">{row.program?.name}</td>
                                <td className="px-2 py-1">{row.assignment.workload}</td>
                                <td className="px-2 py-1">{row.assignment.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Error rows */}
                  {errorRows.length > 0 && (
                    <div>
                      <p className="text-xs text-destructive mb-1">Lignes en erreur (ignorées)</p>
                      <div className="border border-destructive/30 rounded-md overflow-auto max-h-32 bg-destructive/5">
                        <table className="text-xs w-full">
                          <thead className="bg-destructive/10">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-medium">Ligne</th>
                              <th className="px-2 py-1.5 text-left font-medium">Erreurs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {errorRows.map((row) => (
                              <tr key={row.rowIndex} className="border-t border-destructive/20">
                                <td className="px-2 py-1">{row.rowIndex}</td>
                                <td className="px-2 py-1">{row.errors.join(" · ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {applying && progress && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Application en cours... {progress.done}/{progress.total}
                  </p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Done */}
              {done && (
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                  ✓ {validRows.length} assignment(s) appliqué(s) avec succès.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm border border-input hover:bg-accent transition-colors"
              >
                {done ? "Fermer" : "Annuler"}
              </button>
              {!done && validRows.length > 0 && (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="rounded-md px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {applying ? "Application..." : `Appliquer ${validRows.length} ligne(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
