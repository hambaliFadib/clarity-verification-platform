"use client";
import { useState } from "react";
import Link from "next/link";
import { defects, activityFeed } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronRight, Bug, FileWarning } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { getDefectStatusBadgeVariant, severityBadgeVariants } from "@/lib/badge-variants";

export default function DefectsPage() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const criticalCount = defects.filter((d) => d.severity === "Critical").length;
  const highCount = defects.filter((d) => d.severity === "High").length;
  const mediumCount = defects.filter((d) => d.severity === "Medium").length;
  const lowCount = defects.filter((d) => d.severity === "Low").length;

  const statusTabs = [
    { label: "OPEN", count: defects.filter((d) => d.status === "Open").length, value: "open" },
    { label: "IN PROGRESS", count: defects.filter((d) => d.status === "In Progress").length, value: "in-progress" },
    { label: "RESOLVED", count: defects.filter((d) => d.status === "Resolved").length, value: "resolved" },
    { label: "CLOSED", count: defects.filter((d) => d.status === "Closed").length, value: "closed" },
    { label: "BLOCKED", count: defects.filter((d) => d.status === "Blocked").length, value: "blocked" },
  ];

  const grouped = defects.reduce<Record<string, typeof defects>>((acc, d) => {
    const key = d.linkedTestRun || "Manual";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (key: string) => expandedGroups[key] !== false;

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 animate-fade-in">
        <PageHeader
          title="Defects"
          subtitle="Track and manage bugs found during testing"
          actions={<Button><Plus className="h-4 w-4" /> Report Defect</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="CRITICAL" value={criticalCount} valueColor="text-error" hoverBorderColor="hover:border-error" />
          <KpiCard label="HIGH" value={highCount} hoverBorderColor="hover:border-orange-400" />
          <KpiCard label="MEDIUM" value={mediumCount} hoverBorderColor="hover:border-primary-fixed-dim" />
          <KpiCard label="LOW" value={lowCount} hoverBorderColor="hover:border-outline" />
        </div>

        <StatusTabs tabs={statusTabs} defaultValue="open" />
        <SearchFilter placeholder="Search defects..." />

        <div className="space-y-3">
          {Object.entries(grouped).map(([groupName, items]) => (
            <section key={groupName} className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-subtle">
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full bg-surface-container-low px-4 py-2.5 border-b border-outline-variant flex items-center justify-between hover:bg-surface-container transition-colors"
              >
                <div className="flex items-center gap-2">
                  {groupName === "Manual" ? <FileWarning className="h-4 w-4 text-outline" /> : <Bug className="h-4 w-4 text-outline" />}
                  <span className="text-label-bold font-label-bold">{groupName === "Manual" ? "Manual" : `Run: ${groupName}`}</span>
                  <span className="bg-white border border-outline-variant text-[10px] font-bold px-1.5 py-0.5 rounded">{items.length}</span>
                </div>
                {isExpanded(groupName) ? <ChevronDown className="h-4 w-4 text-outline" /> : <ChevronRight className="h-4 w-4 text-outline" />}
              </button>
              {isExpanded(groupName) && (
                <div className="divide-y divide-outline-variant/50">
                  {items.map((d) => (
                    <Link key={d.id} href={`/defects/${d.id}`} className="block p-4 hover:bg-surface-container-low transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={severityBadgeVariants[d.severity]}>{d.severity}</Badge>
                            <Badge variant={getDefectStatusBadgeVariant(d.status)}>{d.status}</Badge>
                            {d.type !== "Bug" && <Badge variant="outline">{d.type}</Badge>}
                          </div>
                          <h4 className="text-body-md font-medium text-on-surface">{d.title}</h4>
                          {d.description && <p className="text-body-sm text-on-surface-variant line-clamp-1">{d.description}</p>}
                        </div>
                        <span className="text-[11px] text-outline flex-shrink-0 ml-4">{timeAgo(d.createdAt)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="flex justify-between items-center text-[11px] text-outline pt-2">
          <span>Showing {defects.length} of {defects.length} entries</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            System Operational
          </div>
        </div>
      </div>

      <aside className="hidden xl:flex w-80 bg-white/80 backdrop-blur-sm border-l border-outline-variant flex-col p-6 gap-6 overflow-y-auto">
        <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">Recent Activity</h3>
        <div className="space-y-4">
          {activityFeed.slice(0, 6).map((act) => (
            <div key={act.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">
                {act.userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-body-sm">
                  <span className="font-bold">{act.user}</span>{" "}
                  {act.action}{" "}
                  <span className="text-primary-container font-medium">{act.targetId}</span>
                </p>
                <p className="text-[10px] text-outline">{timeAgo(act.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
