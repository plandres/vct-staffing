"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { PortfolioCompany } from "@/types/database";
import { Send, Loader2 } from "lucide-react";

interface RequestFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

export function RequestForm({ onCreated, onCancel }: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from("portfolio_companies")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (data) setCompanies(data as PortfolioCompany[]);
    };
    fetchCompanies();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("support_requests").insert({
      requester_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      company_id: companyId || null,
      priority,
      status: "submitted",
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      onCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Décrivez brièvement votre demande..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Détails, contexte, attentes..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Société
          </label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="">Aucune société spécifique</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
          >
            <option value="low">Basse</option>
            <option value="normal">Normale</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Soumettre
            </>
          )}
        </button>
      </div>
    </form>
  );
}
