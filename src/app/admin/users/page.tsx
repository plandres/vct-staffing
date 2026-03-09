"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/lib/utils/roles";
import { ROLE_HIERARCHY } from "@/lib/utils/roles";
import {
  Shield,
  ShieldCheck,
  User,
  Users,
  Eye,
  MessageSquare,
  ChevronDown,
  Check,
  X,
  Search,
} from "lucide-react";

const ROLE_META: Record<UserRole, { label: string; icon: typeof Shield; color: string }> = {
  owner: { label: "Owner", icon: ShieldCheck, color: "text-purple-700 bg-purple-50" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-700 bg-blue-50" },
  core_vct: { label: "Core VCT", icon: Users, color: "text-green-700 bg-green-50" },
  sop: { label: "SOP", icon: User, color: "text-amber-700 bg-amber-50" },
  requester: { label: "Requester", icon: MessageSquare, color: "text-gray-700 bg-gray-100" },
  viewer: { label: "Viewer", icon: Eye, color: "text-gray-500 bg-gray-50" },
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("viewer");

  const { profile: currentProfile } = useAuth();
  const supabase = createBrowserClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.initials && p.initials.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    // Prevent changing owner role unless current user is owner
    if (currentProfile?.role !== "owner" && newRole === "owner") return;
    // Prevent removing own owner role
    if (profileId === currentProfile?.id && currentProfile?.role === "owner") return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profileId);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
    }
    setEditingId(null);
  };

  const handleToggleActive = async (profileId: string, isActive: boolean) => {
    if (profileId === currentProfile?.id) return; // Can't deactivate yourself

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !isActive })
      .eq("id", profileId);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, is_active: !isActive } : p))
      );
    }
  };

  const availableRoles = Object.entries(ROLE_META).filter(([role]) => {
    if (currentProfile?.role !== "owner" && role === "owner") return false;
    return true;
  });

  return (
    <AuthGuard requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header
            title="Gestion des utilisateurs"
            description="Gérez les rôles et les accès des membres"
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email ou initiales..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Role legend */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_META).map(([role, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <div
                      key={role}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </div>
                  );
                })}
              </div>

              {/* Users table */}
              {loading ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  Chargement...
                </div>
              ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Utilisateur
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Initiales
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Rôle
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Statut
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredProfiles.map((profile) => {
                        const roleMeta = ROLE_META[profile.role as UserRole] || ROLE_META.viewer;
                        const RoleIcon = roleMeta.icon;
                        const isEditing = editingId === profile.id;
                        const isSelf = profile.id === currentProfile?.id;

                        return (
                          <tr key={profile.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {profile.full_name}
                                </p>
                                <p className="text-xs text-gray-500">{profile.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {profile.initials || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={editRole}
                                    onChange={(e) =>
                                      setEditRole(e.target.value as UserRole)
                                    }
                                    className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                  >
                                    {availableRoles.map(([role, meta]) => (
                                      <option key={role} value={role}>
                                        {meta.label}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() =>
                                      handleRoleChange(profile.id, editRole)
                                    }
                                    className="p-1 text-green-600 hover:text-green-800"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (isSelf && profile.role === "owner") return;
                                    setEditingId(profile.id);
                                    setEditRole(profile.role as UserRole);
                                  }}
                                  disabled={isSelf && profile.role === "owner"}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleMeta.color} ${
                                    isSelf && profile.role === "owner"
                                      ? "cursor-default"
                                      : "hover:opacity-80 cursor-pointer"
                                  }`}
                                >
                                  <RoleIcon className="h-3 w-3" />
                                  {roleMeta.label}
                                  {!(isSelf && profile.role === "owner") && (
                                    <ChevronDown className="h-3 w-3 ml-0.5" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  profile.is_active
                                    ? "bg-green-50 text-green-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    profile.is_active ? "bg-green-500" : "bg-red-500"
                                  }`}
                                />
                                {profile.is_active ? "Actif" : "Inactif"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {!isSelf && (
                                <button
                                  onClick={() =>
                                    handleToggleActive(profile.id, profile.is_active)
                                  }
                                  className={`text-xs px-3 py-1 rounded border transition-colors ${
                                    profile.is_active
                                      ? "text-red-600 border-red-200 hover:bg-red-50"
                                      : "text-green-600 border-green-200 hover:bg-green-50"
                                  }`}
                                >
                                  {profile.is_active ? "Désactiver" : "Réactiver"}
                                </button>
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
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
