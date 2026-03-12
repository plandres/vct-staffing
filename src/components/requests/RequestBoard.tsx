"use client";

import { useMemo } from "react";
import type { SupportRequestWithDetails, RequestStatus } from "@/types/database";
import {
  Clock,
  Eye,
  UserCheck,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

const COLUMNS = [
  { key: "submitted", label: "Soumises", icon: Clock, color: "border-gray-300" },
  { key: "reviewed", label: "En revue", icon: Eye, color: "border-blue-300" },
  { key: "assigned", label: "Assignées", icon: UserCheck, color: "border-purple-300" },
  { key: "in_progress", label: "En cours", icon: Play, color: "border-amber-300" },
  { key: "completed", label: "Terminées", icon: CheckCircle, color: "border-green-300" },
  { key: "rejected", label: "Rejetées", icon: XCircle, color: "border-red-300" },
] as const;

const PRIORITY_ICON: Record<string, { icon: typeof ArrowUp; color: string }> = {
  urgent: { icon: AlertTriangle, color: "text-red-600" },
  high: { icon: ArrowUp, color: "text-orange-500" },
  normal: { icon: ArrowRight, color: "text-gray-400" },
  low: { icon: ArrowDown, color: "text-gray-300" },
};

interface RequestBoardProps {
  requests: SupportRequestWithDetails[];
  onStatusChange: (requestId: string, newStatus: RequestStatus) => void;
  onAssign: (requestId: string, assigneeId: string) => void;
  canManage: boolean;
}

export function RequestBoard({
  requests,
  onStatusChange,
  canManage,
}: RequestBoardProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, SupportRequestWithDetails[]>();
    for (const col of COLUMNS) {
      map.set(col.key, []);
    }
    for (const req of requests) {
      const list = map.get(req.status) ?? [];
      list.push(req);
      map.set(req.status, list);
    }
    return map;
  }, [requests]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  const nextStatus = (current: string): RequestStatus | null => {
    const order: RequestStatus[] = ["submitted", "reviewed", "assigned", "in_progress", "completed"];
    const idx = order.indexOf(current as RequestStatus);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.key) ?? [];
        const ColIcon = col.icon;

        return (
          <div
            key={col.key}
            className={`flex-shrink-0 w-72 bg-gray-50 rounded-lg border-t-2 ${col.color}`}
          >
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ColIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">{col.label}</span>
              </div>
              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            </div>

            <div className="p-2 space-y-2 min-h-[200px]">
              {items.map((req) => {
                const priority = PRIORITY_ICON[req.priority] ?? PRIORITY_ICON.normal;
                const PriorityIcon = priority.icon;
                const next = nextStatus(req.status);

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-lg border p-3 shadow-sm hover:shadow transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {req.title}
                      </h4>
                      <span title={req.priority}>
                        <PriorityIcon
                          className={`h-4 w-4 shrink-0 ${priority.color}`}
                        />
                      </span>
                    </div>

                    {req.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {req.description}
                      </p>
                    )}

                    {req.company && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded mb-2">
                        {(req.company as { name: string }).name}
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {(req.requester as { initials: string })?.initials ?? "?"} &middot;{" "}
                        {formatDate(req.created_at)}
                      </span>
                      {req.assignee && (
                        <span className="font-mono text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                          {(req.assignee as { initials: string }).initials}
                        </span>
                      )}
                    </div>

                    {canManage && next && (
                      <button
                        onClick={() => onStatusChange(req.id, next)}
                        className="mt-2 w-full text-xs text-center py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        &rarr;{" "}
                        {COLUMNS.find((c) => c.key === next)?.label ?? next}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
