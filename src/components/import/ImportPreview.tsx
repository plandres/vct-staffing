"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import type { ParseResult, Assignment } from "./RdqmUploader";
import { WorkloadBadge } from "../staffing/WorkloadBadge";

interface ImportPreviewProps {
  result: ParseResult;
  onConfirm: (assignments: Assignment[]) => Promise<void>;
  onCancel: () => void;
}

type GuardrailLevel = "ok" | "warning" | "blocking";

interface Guardrail {
  level: GuardrailLevel;
  message: string;
}

export function ImportPreview({ result, onConfirm, onCancel }: ImportPreviewProps) {
  const [importing, setImporting] = useState(false);

  const guardrails = useMemo(() => {
    const checks: Guardrail[] = [];

    if (!result.can_upsert_staffing) {
      checks.push({
        level: "blocking",
        message:
          "Fichier PDF : seules les priorités sont extraites. Le staffing ne sera pas mis à jour.",
      });
    }

    if (result.warnings) {
      for (const w of result.warnings) {
        if (w.startsWith("Unknown initials:")) {
          checks.push({
            level: "blocking",
            message: `Initiales non reconnues : ${w.replace("Unknown initials: ", "")}. Ajoutez ce membre dans la configuration avant d'importer.`,
          });
        } else {
          checks.push({ level: "warning", message: w });
        }
      }
    }

    if (result.total_assignments_found && result.total_assignments_found > 0) {
      const threshold = Math.ceil(result.total_assignments_found * 0.3);
      if (result.total_assignments_found > threshold + 10) {
        checks.push({
          level: "warning",
          message: `${result.total_assignments_found} assignments détectés. Vérifiez que le fichier correspond bien à la période en cours.`,
        });
      }
    }

    if (checks.length === 0) {
      checks.push({
        level: "ok",
        message: "Aucun problème détecté. L'import peut être confirmé.",
      });
    }

    return checks;
  }, [result]);

  const hasBlocking = guardrails.some((g) => g.level === "blocking");

  const assignmentsByCompany = useMemo(() => {
    if (!result.assignments) return new Map<string, Assignment[]>();
    const map = new Map<string, Assignment[]>();
    for (const a of result.assignments) {
      const existing = map.get(a.company) || [];
      existing.push(a);
      map.set(a.company, existing);
    }
    return map;
  }, [result.assignments]);

  const handleConfirm = async () => {
    if (hasBlocking || !result.assignments) return;
    setImporting(true);
    try {
      await onConfirm(result.assignments);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guardrails */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Vérifications</h3>
        {guardrails.map((g, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              g.level === "blocking"
                ? "bg-red-50 text-red-800"
                : g.level === "warning"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-green-50 text-green-800"
            }`}
          >
            {g.level === "blocking" && <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            {g.level === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />}
            {g.level === "ok" && <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />}
            <span>{g.message}</span>
          </div>
        ))}
      </div>

      {/* File summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Fichier</p>
          <p className="text-sm font-medium truncate">{result.file_name}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Type</p>
          <p className="text-sm font-medium uppercase">{result.file_type}</p>
        </div>
        {result.slide_count && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Slides</p>
            <p className="text-sm font-medium">{result.slide_count}</p>
          </div>
        )}
        {result.total_assignments_found !== undefined && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Assignments</p>
            <p className="text-sm font-medium">{result.total_assignments_found}</p>
          </div>
        )}
      </div>

      {/* Found data summary */}
      {result.companies_found && result.companies_found.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Sociétés détectées ({result.companies_found.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.companies_found.map((c) => (
              <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.members_found && result.members_found.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Membres détectés ({result.members_found.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {result.members_found.map((m) => (
              <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Assignment details by company */}
      {assignmentsByCompany.size > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Détail des assignments</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Société</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Membre</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Programmes</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Charge</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Array.from(assignmentsByCompany.entries()).map(([company, assignments]) =>
                  assignments.map((a, i) => (
                    <tr key={`${company}-${a.member_initials}-${i}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">
                        {i === 0 ? company : ""}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{a.member_initials}</td>
                      <td className="px-3 py-2 text-xs">{a.programs.join(", ")}</td>
                      <td className="px-3 py-2">
                        <WorkloadBadge workload={a.workload} />
                      </td>
                      <td className="px-3 py-2 text-xs capitalize">{a.status.replace("_", " ")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF priorities */}
      {result.priorities_found && result.priorities_found.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Priorités extraites (PDF)
          </h3>
          <div className="space-y-2">
            {result.priorities_found.map((p, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Page {p.page}</p>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {p.priorities.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
        {result.can_upsert_staffing && (
          <button
            onClick={handleConfirm}
            disabled={hasBlocking || importing}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-colors
              ${hasBlocking || importing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
              }
            `}
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Confirmer l'import
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
