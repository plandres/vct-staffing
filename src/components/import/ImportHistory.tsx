"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { FileText, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import type { RdqmImport } from "@/types/database";

export function ImportHistory() {
  const [imports, setImports] = useState<RdqmImport[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  const fetchImports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rdqm_imports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setImports(data as RdqmImport[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchImports();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Historique des imports</h3>
        <button
          onClick={fetchImports}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-500">Chargement...</div>
      ) : imports.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Aucun import pour le moment</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Fichier</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Type</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Statut</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Date</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Résumé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {imports.map((imp) => {
                const summary = imp.changes_summary as Record<string, number> | null;
                return (
                  <tr key={imp.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium truncate max-w-[200px]">
                      {imp.file_name}
                    </td>
                    <td className="px-3 py-2 uppercase text-xs font-mono">
                      {imp.file_type}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(imp.status)}
                        <span className="capitalize text-xs">{imp.status}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDate(imp.created_at)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {summary ? (
                        <span>
                          {summary.created ?? 0} créés, {summary.updated ?? 0} modifiés
                        </span>
                      ) : imp.error_log ? (
                        <span className="text-red-500 truncate max-w-[200px] block">
                          {imp.error_log}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
