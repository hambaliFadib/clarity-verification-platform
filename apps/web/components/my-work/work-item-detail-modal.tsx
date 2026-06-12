"use client";

import { useEffect, useState } from "react";
import type { ElementType } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ListChecks, Pencil, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkItem } from "@/lib/types";

interface WorkItemDetailModalProps {
  isOpen: boolean;
  item: WorkItem | null;
  onClose: () => void;
  onEdit: (item: WorkItem) => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface-container-lowest border border-outline-variant px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-label-sm font-semibold text-outline">{label}</div>
        <div className="text-body-md font-semibold text-on-surface break-words">{value || "-"}</div>
      </div>
    </div>
  );
}

export function WorkItemDetailModal({ isOpen, item, onClose, onEdit }: WorkItemDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !item) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant bg-surface shadow-2xl animate-fade-in-up">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded bg-surface-container-high px-2 py-1 text-[10px] font-bold text-primary">
                {item.type}
              </span>
              <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                {item.status}
              </span>
            </div>
            <h2 className="text-title-md font-bold text-on-surface break-words">{item.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            type="button"
            aria-label="Close detail"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant={item.priority === "High" ? "high" : item.priority === "Critical" ? "critical" : item.priority === "Medium" ? "medium" : "low"}>
              {item.priority}
            </Badge>
            <span className="rounded bg-tertiary-fixed px-2 py-1 text-[10px] font-bold text-tertiary">
              {item.progress}% progress
            </span>
            {item.dueIn && (
              <span className="rounded bg-primary-container px-2 py-1 text-[10px] font-bold text-white">
                {item.dueIn}
              </span>
            )}
          </div>

          <div className="grid gap-3">
            <DetailRow icon={User} label="Assignee" value={item.assignedTo} />
            <DetailRow icon={ListChecks} label="Scope" value={item.scope} />
            <DetailRow icon={CalendarDays} label="Created" value={new Date(item.createdAt).toLocaleString()} />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-outline-variant px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => onEdit(item)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
