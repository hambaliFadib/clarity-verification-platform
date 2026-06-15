"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { AuditTrail } from "@/components/approval/audit-trail";
import { AlertTriangle, Shield } from "lucide-react";

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
}

export default function ApprovalsPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await fetch("/api/approval-gates?limit=100", { cache: "no-store" });
        if (response.ok && isMounted) {
          setEntries(await response.json());
        } else if (isMounted) {
          setEntries([]);
        }
      } catch (error) {
        console.error("Failed to load approval summary", error);
        if (isMounted) setEntries([]);
      }
    }

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  const summary = useMemo(() => {
    const uniqueEntities = new Set(entries.map((entry) => `${entry.entity_type}:${entry.entity_id}`));
    return {
      auditEvents: entries.length,
      approved: entries.filter((entry) => entry.action === "approved").length,
      rejected: entries.filter((entry) => entry.action === "rejected").length,
      gatedEntities: uniqueEntities.size,
    };
  }, [entries]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Approvals"
        subtitle="Review approval evidence and workflow audit activity"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="AUDIT EVENTS" value={summary.auditEvents} />
        <KpiCard label="APPROVED" value={summary.approved} hoverBorderColor="hover:border-success" />
        <KpiCard label="REJECTED" value={summary.rejected} hoverBorderColor="hover:border-error" />
        <KpiCard label="GATED ENTITIES" value={summary.gatedEntities} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-body-lg font-semibold">Approval Gates</h3>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-on-surface-variant">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <div>
              <div className="font-medium text-on-surface">Decision actions locked</div>
              <p className="mt-0.5">
                Approval gates are visible as audit evidence while RBAC approval enforcement is completed.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AuditTrail />
        </div>
      </div>
    </div>
  );
}
