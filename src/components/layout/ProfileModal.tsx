"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import type { Profile } from "@/types/database";

interface ProfileModalProps {
  profile: Profile;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}

export function ProfileModal({ profile, open, onClose, onSaved }: ProfileModalProps) {
  const [fullName, setFullName] = useState(profile.full_name);
  const [initials, setInitials] = useState(profile.initials ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [specialties, setSpecialties] = useState(profile.specialties.join(", "));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setFullName(profile.full_name);
    setInitials(profile.initials ?? "");
    setPhone(profile.phone ?? "");
    setSpecialties(profile.specialties.join(", "));
  }, [profile]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const updates = {
      full_name: fullName.trim(),
      initials: initials.trim() || null,
      phone: phone.trim() || null,
      specialties: specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id)
      .select()
      .single();

    setSaving(false);
    if (error) {
      toast("Erreur lors de la sauvegarde du profil", "error");
    } else {
      toast("Profil mis à jour");
      onSaved(data as Profile);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Mon profil</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Initiales</label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              maxLength={4}
              className="w-24 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+33 6 ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Spécialités</label>
            <input
              type="text"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Finance, M&A, Digital..."
            />
            <p className="text-xs text-muted-foreground mt-1">Séparées par des virgules</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-md border px-3 py-2 text-sm bg-muted text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <input
              type="text"
              value={profile.role.replace("_", " ").toUpperCase()}
              disabled
              className="w-full rounded-md border px-3 py-2 text-sm bg-muted text-muted-foreground"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
