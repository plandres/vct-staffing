"use client";

import { useState, useCallback } from "react";
import { Upload, FileUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "parsing" | "done" | "error";

interface RdqmUploaderProps {
  onParseComplete: (result: ParseResult) => void;
}

export interface ParseResult {
  file_type: "pptx" | "pdf";
  file_name: string;
  can_upsert_staffing: boolean;
  // PPTX fields
  assignments?: Assignment[];
  companies_found?: string[];
  members_found?: string[];
  total_assignments_found?: number;
  // PDF fields
  pages?: { page: number; text: string }[];
  priorities_found?: { page: number; priorities: string[] }[];
  page_count?: number;
  // Common
  warnings?: string[];
  slide_count?: number;
}

export interface Assignment {
  company: string;
  member_initials: string;
  programs: string[];
  workload: "heavy" | "light" | "none" | "unknown";
  status: string;
  raw_text: string;
  raw_fill_hex: string | null;
  slide_index: number;
}

export function RdqmUploader({ onParseComplete }: RdqmUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const parserUrl = process.env.NEXT_PUBLIC_PARSER_URL || "http://localhost:8000";

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "pptx" && ext !== "pdf") {
        setError("Format non supporté. Seuls les fichiers .pptx et .pdf sont acceptés.");
        setStatus("error");
        return;
      }

      setFileName(file.name);
      setError(null);
      setStatus("uploading");

      try {
        setStatus("parsing");

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${parserUrl}/parse`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ detail: "Erreur serveur" }));
          throw new Error(errData.detail || `Erreur HTTP ${response.status}`);
        }

        const result: ParseResult = await response.json();
        setStatus("done");
        onParseComplete(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du parsing");
        setStatus("error");
      }
    },
    [parserUrl, onParseComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragOver ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"}
          ${status === "idle" || status === "error" ? "cursor-pointer" : "cursor-default"}
        `}
      >
        <input
          type="file"
          accept=".pptx,.pdf"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={status === "uploading" || status === "parsing"}
        />

        {status === "idle" && (
          <div className="space-y-2">
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Glissez un fichier RDQM ici ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-gray-500">
              Formats acceptés : .pptx (staffing complet) ou .pdf (priorités uniquement)
            </p>
          </div>
        )}

        {(status === "uploading" || status === "parsing") && (
          <div className="space-y-2">
            <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-700">
              {status === "uploading" ? "Upload en cours..." : "Analyse du fichier..."}
            </p>
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
          </div>
        )}

        {status === "done" && (
          <div className="space-y-2">
            <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
            <p className="text-sm font-medium text-green-700">Fichier analysé avec succès</p>
            {fileName && <p className="text-xs text-gray-500">{fileName}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Glissez un autre fichier pour remplacer
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-2">
            <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
            <p className="text-sm font-medium text-red-700">Erreur</p>
            <p className="text-xs text-red-500">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Cliquez ou glissez pour réessayer</p>
          </div>
        )}
      </div>

      {status !== "idle" && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FileUp className="h-3 w-3" />
          <span>
            PPTX : extraction complète du staffing (couleurs, initiales, programmes).
            PDF : extraction textuelle des priorités uniquement.
          </span>
        </div>
      )}
    </div>
  );
}
