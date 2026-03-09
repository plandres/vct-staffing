"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Grid3X3,
  Building2,
  FolderKanban,
  MessageSquarePlus,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { hasMinRole } from "@/lib/utils/roles";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, minRole: "viewer" as const },
  { href: "/staffing", label: "Staffing Matrix", icon: Grid3X3, minRole: "viewer" as const },
  { href: "/companies", label: "Portfolio", icon: Building2, minRole: "viewer" as const },
  { href: "/programs", label: "Programs", icon: FolderKanban, minRole: "viewer" as const },
  { href: "/requests", label: "Requests", icon: MessageSquarePlus, minRole: "requester" as const },
];

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Users", icon: Users, minRole: "admin" as const },
  { href: "/admin/import", label: "Import RDQM", icon: Upload, minRole: "admin" as const },
  { href: "/admin/config", label: "Config", icon: Settings, minRole: "admin" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, role } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          S2
        </div>
        <div>
          <p className="text-sm font-semibold">VCT Staffing</p>
          <p className="text-xs text-muted-foreground">Seven2</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {NAV_ITEMS.filter((item) => hasMinRole(role, item.minRole)).map(
            (item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            }
          )}
        </div>

        {/* Admin section */}
        {hasMinRole(role, "admin") && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
              Admin
            </p>
            <div className="space-y-1">
              {ADMIN_ITEMS.filter((item) => hasMinRole(role, item.minRole)).map(
                (item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                }
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {profile?.initials ?? "?"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {profile?.full_name ?? "Loading..."}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.role?.replace("_", " ").toUpperCase() ?? ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
