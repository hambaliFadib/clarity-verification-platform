"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  XCircle,
} from "lucide-react";

interface ApprovalGate {
  id: string;
  gate_name: string;
  status: "pending" | "approved" | "rejected";
  from_status: string;
  to_status: string;
  ai_recommendation?: string;
  ai_confidence?: number;
  decision_by?: string;
  decision_at?: string;
  decision_notes?: string;
}

interface ApprovalGatesPanelProps {
  entityType: string;
  entityId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

const gateStatusConfig = {
  pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-50", label: "Pending" },
  approved: { icon: CheckCircle2, color: "text-success", bg: "bg-green-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-error", bg: "bg-red-50", label: "Rejected" },
};

const recommendationConfig: Record<string, { color: string; label: string }> = {
  go: { color: "text-success", label: "GO" },
  "no-go": { color: "text-error", label: "NO-GO" },
  conditional: { color: "text-orange-500", label: "CONDITIONAL" },
};

export function ApprovalGatesPanel({
  entityType,
  entityId,
}: ApprovalGatesPanelProps) {
  const [gates, setGates] = useState<ApprovalGate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGate, setExpandedGate] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGates() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/approval-gates/entity/${entityType}/${entityId}`);
        if (response.ok && isMounted) {
          setGates(await response.json());
        } else if (isMounted) {
          setGates([]);
        }
      } catch (error) {
        console.error("Failed to fetch gates", error);
        if (isMounted) setGates([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchGates();
    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  if (isLoading) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-surface-container-low rounded" />
          <div className="h-20 bg-surface-container-low rounded-lg" />
          <div className="h-20 bg-surface-container-low rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-body-lg font-semibold">Approval Gates</h3>
      </div>

      {gates.length === 0 ? (
        <div className="text-center py-6 text-outline">
          <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No approval gates configured</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gates.map((gate) => {
            const config = gateStatusConfig[gate.status] || gateStatusConfig.pending;
            const Icon = config.icon;
            const isExpanded = expandedGate === gate.id;

            return (
              <div
                key={gate.id}
                className="border border-outline-variant rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  className={`flex w-full items-center justify-between p-4 text-left hover:bg-surface-container-low transition-colors ${
                    gate.status === "approved"
                      ? "bg-green-50/50"
                      : gate.status === "rejected"
                        ? "bg-red-50/50"
                        : ""
                  }`}
                  onClick={() => setExpandedGate(isExpanded ? null : gate.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{gate.gate_name}</div>
                      <div className="text-xs text-outline">
                        {gate.from_status} -&gt; {gate.to_status}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {gate.ai_recommendation && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${recommendationConfig[gate.ai_recommendation]?.color || ""}`}
                      >
                        AI: {recommendationConfig[gate.ai_recommendation]?.label || gate.ai_recommendation.toUpperCase()}
                        {gate.ai_confidence ? ` (${gate.ai_confidence}%)` : ""}
                      </Badge>
                    )}

                    <Badge variant={gate.status === "approved" ? "success" : gate.status === "rejected" ? "failed" : "outline"}>
                      {config.label}
                    </Badge>

                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-outline" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-outline" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-outline-variant p-4 bg-surface-container-low/30">
                    {gate.status === "pending" ? (
                      <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-on-surface-variant">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                        <div>
                          <div className="font-medium text-on-surface">Decision actions locked</div>
                          <p className="mt-0.5">
                            Approval decisions will be enabled after RBAC approval enforcement is wired end to end.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1">
                        {gate.decision_by && (
                          <div className="text-on-surface-variant">
                            Decided by: <span className="font-medium">{gate.decision_by}</span>
                          </div>
                        )}
                        {gate.decision_at && (
                          <div className="text-on-surface-variant">
                            At: <span className="font-medium">{new Date(gate.decision_at).toLocaleString()}</span>
                          </div>
                        )}
                        {gate.decision_notes && (
                          <div className="text-on-surface-variant">
                            Notes: <span className="font-medium">{gate.decision_notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
