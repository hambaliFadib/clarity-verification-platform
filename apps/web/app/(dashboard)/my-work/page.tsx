"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Folder, BarChart3, AlertCircle, Users, Plus, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkItem } from "@/lib/types";

const columns = [
  { key: "To Do", label: "Not Started", subtitle: "Belum dimulai atau masih draft.", countColor: "text-outline" },
  { key: "In Progress", label: "Active", subtitle: "Sedang berjalan atau sudah siap.", countColor: "text-primary" },
  { key: "Blocked", label: "Needs Attention", subtitle: "Gagal, blocked, rejected, overdue.", countColor: "text-error" },
  { key: "Completed", label: "Done", subtitle: "Selesai atau passed.", countColor: "text-emerald-600" },
];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "To Do": return "bg-primary/10 text-primary border border-primary/20";
    case "In Progress": return "bg-primary/10 text-primary border border-primary/20";
    case "Blocked": return "bg-error/10 text-error border border-error/20";
    case "Completed": return "bg-emerald-100 text-emerald-700 border border-emerald-700/20";
    default: return "bg-slate-100 text-slate-500";
  }
}

function WorkItemCard({ item }: { item: WorkItem }) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-subtle hover:border-primary transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-surface-container-high text-primary rounded">
            {item.type}
          </span>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", getStatusBadgeClass(item.status))}>
            {item.status}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="text-outline hover:text-primary transition-colors p-0.5" type="button" aria-label={`View ${item.title}`}>
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button className="text-outline hover:text-primary transition-colors p-0.5" type="button" aria-label={`Edit ${item.title}`}>
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <h3 className="font-bold text-body-md mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge variant={item.priority === "High" ? "high" : item.priority === "Critical" ? "critical" : item.priority === "Medium" ? "medium" : "low"}>
          {item.priority}
        </Badge>
        {item.dueIn && (
          <span className="bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded">
            {item.dueIn}
          </span>
        )}
        <span className="bg-tertiary-fixed text-tertiary text-[10px] font-bold px-2 py-0.5 rounded">
          {item.progress}% progress
        </span>
      </div>
      {item.scope && <div className="text-[11px] text-outline mb-3">Scope: {item.scope}</div>}
      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
        <span className="text-label-md text-on-surface-variant">{item.assignedTo}</span>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkItems() {
      const response = await fetch("/api/work-items", { cache: "no-store" });
      if (isMounted && response.ok) setWorkItems(await response.json());
    }

    loadWorkItems().catch(() => {
      if (isMounted) setWorkItems([]);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTasks = workItems.filter((item) => item.status === "In Progress").length;
  const needsAttention = workItems.filter((item) => item.status === "Blocked").length;
  const averageProgress = workItems.length
    ? Math.round(workItems.reduce((sum, item) => sum + item.progress, 0) / workItems.length)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6">
        <PageHeader
          title="My Work"
          badge={
            <span className="bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-normal">
              Execution
            </span>
          }
        />
      </div>

      <div className="px-8 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Work" value={workItems.length} icon={Folder} />
        <KpiCard label="Active Tasks" value={activeTasks} icon={BarChart3} valueColor="text-primary" iconColor="text-tertiary" />
        <KpiCard label="Needs Attention" value={needsAttention.toString().padStart(2, "0")} icon={AlertCircle} valueColor="text-error" iconColor="text-error" hoverBorderColor="hover:border-error" />
        <KpiCard label="Avg Progress" value={`${averageProgress}%`} icon={Users} />
      </div>

      <div className="flex-1 overflow-x-auto px-8 pb-8 flex gap-5 min-h-0">
        {columns.map((col) => {
          const items = workItems.filter((w) => w.status === col.key);
          const isActive = col.key === "In Progress";
          return (
            <div
              key={col.key}
              className={cn(
                "w-80 flex-shrink-0 flex flex-col h-full rounded-2xl p-4",
                isActive
                  ? "bg-white border border-outline-variant shadow-card"
                  : "bg-white/40 border border-outline-variant/50"
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="font-label-bold text-on-surface">{col.label}</span>
                  <span className="text-[11px] text-outline">{col.subtitle}</span>
                </div>
                <span className={cn("font-bold text-xs", col.countColor)}>{items.length}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant bg-white/60 p-4 text-center text-body-sm text-on-surface-variant">
                    No work items.
                  </div>
                ) : items.map((item) => (
                  <WorkItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-8 py-3 bg-white/80 border-t border-outline-variant flex justify-between items-center">
        <div className="text-body-sm text-on-surface-variant">
          Showing {workItems.length} work items
        </div>
      </div>

      <button
        className="fixed bottom-8 right-8 bg-primary text-white w-14 h-14 rounded-2xl shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group"
        type="button"
        aria-label="Create work item"
      >
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-inverse-surface text-inverse-on-surface text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-elevated">
          New Work Item
        </span>
      </button>
    </div>
  );
}
