"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { RdqmUploader, type ParseResult, type Assignment } from "@/components/import/RdqmUploader";
import { ImportPreview } from "@/components/import/ImportPreview";
import { ImportHistory } from "@/components/import/ImportHistory";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

export default function AdminImportPage() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importDone, setImportDone] = useState(false);
  const { user } = useAuth();
  const supabase = createBrowserClient();

  const handleParseComplete = useCallback((result: ParseResult) => {
    setParseResult(result);
    setImportDone(false);
  }, []);

  const handleConfirmImport = useCallback(
    async (assignments: Assignment[]) => {
      if (!user) return;

      // 1. Log the import
      const { data: importRecord } = await supabase
        .from("rdqm_imports")
        .insert({
          file_name: parseResult?.file_name ?? "unknown",
          file_type: parseResult?.file_type ?? "pptx",
          imported_by: user.id,
          status: "processing",
        })
        .select("id")
        .single();

      try {
        // 2. Fetch existing members & companies for mapping
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, initials");
        const { data: companies } = await supabase
          .from("portfolio_companies")
          .select("id, name");
        const { data: programs } = await supabase
          .from("program_categories")
          .select("id, name");

        const memberMap = new Map(
          (profiles ?? []).map((p) => [p.initials?.toUpperCase(), p.id])
        );
        const companyMap = new Map(
          (companies ?? []).map((c) => [c.name.toLowerCase(), c.id])
        );
        const programMap = new Map(
          (programs ?? []).map((p) => [p.name.toLowerCase(), p.id])
        );

        let created = 0;
        let updated = 0;
        let skipped = 0;

        // 3. Upsert each assignment
        for (const a of assignments) {
          const memberId = memberMap.get(a.member_initials.toUpperCase());
          const companyId = companyMap.get(a.company.toLowerCase());

          if (!memberId || !companyId) {
            skipped++;
            continue;
          }

          for (const progName of a.programs) {
            const programId = programMap.get(progName.toLowerCase());
            if (!programId) {
              skipped++;
              continue;
            }

            const { error, status } = await supabase
              .from("staffing_assignments")
              .upsert(
                {
                  member_id: memberId,
                  company_id: companyId,
                  program_id: programId,
                  workload: a.workload === "unknown" ? "light" : a.workload,
                  status: a.status === "ongoing" ? "ongoing" : a.status === "to_start" ? "to_start" : "ongoing",
                  created_by: user.id,
                },
                { onConflict: "member_id,company_id,program_id" }
              );

            if (!error) {
              // 201 = created, 200 = updated
              if (status === 201) created++;
              else updated++;
            } else {
              skipped++;
            }
          }
        }

        // 4. Update import record
        if (importRecord?.id) {
          await supabase
            .from("rdqm_imports")
            .update({
              status: "completed",
              changes_summary: { created, updated, skipped },
            })
            .eq("id", importRecord.id);
        }

        setImportDone(true);
      } catch (err) {
        if (importRecord?.id) {
          await supabase
            .from("rdqm_imports")
            .update({
              status: "failed",
              error_log: err instanceof Error ? err.message : "Unknown error",
            })
            .eq("id", importRecord.id);
        }
        throw err;
      }
    },
    [user, supabase, parseResult]
  );

  const handleCancel = useCallback(() => {
    setParseResult(null);
    setImportDone(false);
  }, []);

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Import RDQM"
            description="Importez un fichier RDQM pour mettre à jour le staffing automatiquement"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Uploader */}
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Upload</h2>
                <RdqmUploader onParseComplete={handleParseComplete} />
              </div>

              {/* Preview */}
              {parseResult && !importDone && (
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-lg font-semibold mb-4">Prévisualisation</h2>
                  <ImportPreview
                    result={parseResult}
                    onConfirm={handleConfirmImport}
                    onCancel={handleCancel}
                  />
                </div>
              )}

              {/* Success message */}
              {importDone && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <p className="text-green-800 font-medium">
                    Import terminé avec succès.
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Le staffing a été mis à jour. Consultez la matrice pour voir les changements.
                  </p>
                  <button
                    onClick={handleCancel}
                    className="mt-4 px-4 py-2 text-sm bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50"
                  >
                    Importer un autre fichier
                  </button>
                </div>
              )}

              {/* History */}
              <div className="bg-white rounded-lg border p-6">
                <ImportHistory />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
