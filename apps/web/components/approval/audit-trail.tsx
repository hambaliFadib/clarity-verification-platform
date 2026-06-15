"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Edit,
  History,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

interface AuditTrailProps {
  entityType?: string;
  entityId?: string;
  limit?: number;
}

const actionConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  created: { icon: Plus, color: "text-success", label: "Created" },
  updated: { icon: Edit, color: "text-primary", label: "Updated" },
  approved: { icon: CheckCircle2, color: "text-success", label: "Approved" },
  rejected: { icon: XCircle, color: "text-error", label: "Rejected" },
  deleted: { icon: Trash2, color: "text-error", label: "Deleted" },
};

export function AuditTrail({ entityType, entityId, limit = 20 }: AuditTrailProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchAuditTrail() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (entityType) params.append("entity_type", entityType);
        if (entityId) params.append("entity_id", entityId);
        params.append("limit", String(limit));

        const response = await fetch(`/api/approval-gates?${params}`);
        if (response.ok && isMounted) {
          setEntries(await response.json());
        } else if (isMounted) {
          setEntries([]);
        }
      } catch (error) {
        console.error("Failed to fetch audit trail", error);
        if (isMounted) setEntries([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAuditTrail();
    return () => {
      isMounted = false;
    };
  }, [entityType, entityId, limit]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-surface-container-low rounded" />
          <div className="h-16 bg-surface-container-low rounded-lg" />
          <div className="h-16 bg-surface-container-low rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h3 className="text-body-lg font-semibold">Activity Log</h3>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-6 text-outline">
          <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const config = actionConfig[entry.action] || actionConfig.updated;
            const Icon = config.icon;

            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-surface-container-low ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{entry.user_id}</span>
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-outline mt-0.5">
                    {entry.entity_type} - {formatTime(entry.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
