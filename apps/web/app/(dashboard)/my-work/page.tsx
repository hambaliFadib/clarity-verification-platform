"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Folder, BarChart3, AlertCircle, Users, Plus, Eye, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkItem, WorkItemStatus } from "@/lib/types";
import { CreateWorkItemModal } from "@/components/my-work/create-work-item-modal";
import { WorkItemDetailModal } from "@/components/my-work/work-item-detail-modal";

const columns = [
  { key: "To Do", label: "Not Started", subtitle: "Belum dimulai atau masih draft.", countColor: "text-muted-foreground" },
  { key: "In Progress", label: "Active", subtitle: "Sedang berjalan atau sudah siap.", countColor: "text-primary" },
  { key: "Blocked", label: "Needs Attention", subtitle: "Gagal, blocked, rejected, overdue.", countColor: "text-error" },
  { key: "Completed", label: "Done", subtitle: "Selesai atau passed.", countColor: "text-emerald-600" },
];

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "To Do": return "neutral";
    case "In Progress": return "info";
    case "Blocked": return "danger";
    case "Completed": return "success";
    default: return "outline";
  }
}

function WorkItemCard({
  item,
  onDragStart,
  onView,
  onEdit,
}: {
  item: WorkItem;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onView: (item: WorkItem) => void;
  onEdit: (item: WorkItem) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      className="bg-card border border-outline-variant rounded-lg p-4 shadow-subtle hover:border-primary hover:-translate-y-px transition-all duration-200 group cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Badge variant="outline" className="border-primary/20 text-primary">{item.type}</Badge>
          <Badge variant={getStatusBadgeVariant(item.status) as any}>{item.status}</Badge>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="text-outline hover:text-primary transition-colors p-0.5"
            type="button"
            aria-label={`View ${item.title}`}
            draggable={false}
            onClick={(event) => {
              event.stopPropagation();
              onView(item);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            className="text-outline hover:text-primary transition-colors p-0.5"
            type="button"
            aria-label={`Edit ${item.title}`}
            draggable={false}
            onClick={(event) => {
              event.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <h3 className="font-semibold text-body-md mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <Badge variant={item.priority === "High" ? "high" : item.priority === "Critical" ? "critical" : item.priority === "Medium" ? "medium" : "low"}>
          {item.priority}
        </Badge>
        {item.dueIn && (
          <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
            {item.dueIn}
          </Badge>
        )}
        <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
          {item.progress}% progress
        </Badge>
      </div>
      {item.scope && <div className="text-caption text-muted-foreground mb-3">Scope: {item.scope}</div>}
      <div className="flex items-center justify-between border-t border-outline-variant pt-3">
        <span className="text-label-md text-muted-foreground">{item.assignedTo}</span>
      </div>
    </div>
  );
}

export default function MyWorkPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<WorkItem | null>(null);
  const [editItem, setEditItem] = useState<WorkItem | null>(null);

  const loadWorkItems = async () => {
    try {
      const response = await fetch("/api/work-items", { cache: "no-store" });
      if (response.ok) {
        setWorkItems(await response.json());
      }
    } catch (err) {
      console.error(err);
      setWorkItems([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      const response = await fetch("/api/work-items", { cache: "no-store" });
      if (isMounted && response.ok) setWorkItems(await response.json());
    }

    initialLoad().catch(() => {
      if (isMounted) setWorkItems([]);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, status: WorkItemStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    const itemToMove = workItems.find((w) => w.id === id);
    if (!itemToMove || itemToMove.status === status) return;

    // Optimistic update
    const previousItems = [...workItems];
    setWorkItems(workItems.map(w => w.id === id ? { ...w, status } : w));

    try {
      const response = await fetch(`/api/work-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      setWorkItems(previousItems); // Revert on failure
    }
  };

  const activeTasks = workItems.filter((item) => item.status === "In Progress").length;
  const needsAttention = workItems.filter((item) => item.status === "Blocked").length;
  const averageProgress = workItems.length
    ? Math.round(workItems.reduce((sum, item) => sum + item.progress, 0) / workItems.length)
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6">
        <PageHeader
          title="My Work"
          subtitle="Your assigned tasks and work items"
        />
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total Work" value={workItems.length} icon={Folder} />
        <KpiCard label="Active Tasks" value={activeTasks} icon={BarChart3} valueColor="text-primary" iconColor="text-tertiary" />
        <KpiCard label="Needs Attention" value={needsAttention} icon={AlertCircle} valueColor="text-error" iconColor="text-error" hoverBorderColor="hover:border-error" />
        <KpiCard label="Avg Progress" value={`${averageProgress}%`} icon={Users} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = workItems.filter((w) => w.status === col.key);
          const isActive = col.key === "In Progress";
          return (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key as WorkItemStatus)}
              className={cn(
                "flex flex-col rounded-lg p-4 transition-colors",
                isActive
                  ? "bg-card border border-outline-variant shadow-card"
                  : "bg-card/40 border border-outline-variant/50 hover:bg-surface-container/30"
              )}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-body-md font-medium text-on-surface">{col.label}</span>
                  <span className="text-caption text-muted-foreground">{col.subtitle}</span>
                </div>
                <span className={cn("font-semibold text-label-sm", col.countColor)}>{items.length}</span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto px-0.5 pt-1 pb-1">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-outline-variant bg-card/60 p-4 text-center text-body-sm text-muted-foreground pointer-events-none">
                    Drop items here.
                  </div>
                ) : items.map((item) => (
                  <WorkItemCard
                    key={item.id}
                    item={item}
                    onDragStart={handleDragStart}
                    onView={setDetailItem}
                    onEdit={setEditItem}
                  />
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <div className="px-6 py-3 bg-card/80 border-t border-outline-variant flex justify-between items-center">
        <div className="text-body-sm text-muted-foreground">
          Showing {workItems.length} work items
        </div>
      </div>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 bg-primary text-white w-14 h-14 rounded-xl shadow-float flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group"
        type="button"
        aria-label="Create work item"
      >
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-3 bg-inverse-surface text-inverse-on-surface text-label-sm font-semibold py-1.5 px-3 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-elevated">
          New Work Item
        </span>
      </button>

      <CreateWorkItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadWorkItems}
      />
      <CreateWorkItemModal
        isOpen={!!editItem}
        mode="edit"
        workItem={editItem}
        onClose={() => setEditItem(null)}
        onSuccess={loadWorkItems}
      />
      <WorkItemDetailModal
        isOpen={!!detailItem}
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setDetailItem(null);
          setEditItem(item);
        }}
      />
    </div>
  );
}
