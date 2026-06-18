"use client";

import type { ElementType } from "react";
import { CalendarDays, ListChecks, Pencil, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
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
    <div className="flex items-start gap-3 rounded-md bg-surface-container-low border border-outline-variant px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-label-sm font-semibold text-outline">{label}</div>
        <div className="text-body-md font-semibold text-on-surface break-words">{value || "-"}</div>
      </div>
    </div>
  );
}

export function WorkItemDetailModal({ isOpen, item, onClose, onEdit }: WorkItemDetailModalProps) {
  if (!isOpen || !item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-md bg-surface-container-high px-2 py-1 text-label-sm font-semibold text-primary">
              {item.type}
            </span>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-label-sm font-semibold text-primary">
              {item.status}
            </span>
          </div>
          <ModalTitle>{item.title}</ModalTitle>
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={item.priority === "High" ? "high" : item.priority === "Critical" ? "critical" : item.priority === "Medium" ? "medium" : "low"}>
            {item.priority}
          </Badge>
          <span className="rounded-md bg-tertiary-fixed px-2 py-1 text-label-sm font-semibold text-tertiary">
            {item.progress}% progress
          </span>
          {item.dueIn && (
            <span className="rounded-md bg-primary-container px-2 py-1 text-label-sm font-semibold text-white">
              {item.dueIn}
            </span>
          )}
        </div>

        <div className="grid gap-3">
          <DetailRow icon={User} label="Assignee" value={item.assignedTo} />
          <DetailRow icon={ListChecks} label="Scope" value={item.scope} />
          <DetailRow icon={CalendarDays} label="Created" value={new Date(item.createdAt).toLocaleString()} />
        </div>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button type="button" onClick={() => onEdit(item)}>
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </ModalFooter>
    </Modal>
  );
}
