"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { RequestBoard } from "@/components/requests/RequestBoard";
import { RequestForm } from "@/components/requests/RequestForm";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { SupportRequestWithDetails, RequestStatus } from "@/types/database";
import { Plus, X } from "lucide-react";
import { hasMinRole } from "@/lib/utils/roles";
import type { UserRole } from "@/lib/utils/roles";

export default function RequestsPage() {
  const [requests, setRequests] = useState<SupportRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { user, profile } = useAuth();
  const supabase = createBrowserClient();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_requests")
      .select(
        `
        *,
        requester:profiles!support_requests_requester_id_fkey(id, full_name, initials, email),
        assignee:profiles!support_requests_assigned_to_fkey(id, full_name, initials),
        company:portfolio_companies(id, name)
      `
      )
      .order("created_at", { ascending: false });

    if (data) setRequests(data as unknown as SupportRequestWithDetails[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (requestId: string, newStatus: RequestStatus) => {
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("support_requests")
      .update(updates)
      .eq("id", requestId);

    if (!error) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? { ...r, status: newStatus, ...(newStatus === "completed" ? { resolved_at: new Date().toISOString() } : {}) }
            : r
        )
      );
    }
  };

  const handleAssign = async (requestId: string, assigneeId: string) => {
    const { error } = await supabase
      .from("support_requests")
      .update({ assigned_to: assigneeId, status: "assigned" })
      .eq("id", requestId);

    if (!error) {
      fetchRequests(); // Refresh to get joined data
    }
  };

  const handleCreated = () => {
    setShowForm(false);
    fetchRequests();
  };

  const canManage = profile && hasMinRole(profile.role as UserRole, "core_vct");

  return (
    <AuthGuard requiredRole="requester">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Demandes de support"
            description="Soumettez et suivez vos demandes d'intervention VCT"
            actions={
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90"
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Fermer
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Nouvelle demande
                  </>
                )}
              </button>
            }
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {showForm && (
                <div className="bg-white border rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Nouvelle demande</h2>
                  <RequestForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />
                </div>
              )}

              {loading ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  Chargement...
                </div>
              ) : (
                <RequestBoard
                  requests={requests}
                  onStatusChange={handleStatusChange}
                  onAssign={handleAssign}
                  canManage={!!canManage}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
