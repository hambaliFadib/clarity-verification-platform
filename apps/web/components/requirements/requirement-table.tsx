"use client";

import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DataTable, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import type { Requirement } from "@/lib/types";

interface RequirementTableProps {
  requirements: Requirement[];
}

function requirementStatusVariant(status: Requirement["status"]): BadgeVariant {
  if (status === "In Review") return "in-review";
  if (status === "Baseline") return "approved";
  if (status === "Archived") return "obsolete";
  return status.toLowerCase() as BadgeVariant;
}

export function RequirementTable({ requirements }: RequirementTableProps) {
  const router = useRouter();

  if (requirements.length === 0) {
    return <EmptyState icon={BookOpen} title="No requirements found" />;
  }

  return (
    <DataTable>
      <TableHead>
        <TableRow>
          <TableHeaderCell>ID</TableHeaderCell>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Module</TableHeaderCell>
          <TableHeaderCell>Priority</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Type</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {requirements.map((req) => (
          <TableRow
            key={req.id}
            clickable
            role="link"
            tabIndex={0}
            onClick={() => router.push(`/requirements/${req.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/requirements/${req.id}`);
              }
            }}
          >
            <TableCell className="font-mono text-code text-primary-container font-medium">
              {req.displayId}
            </TableCell>
            <TableCell className="font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
              {req.title}
            </TableCell>
            <TableCell className="text-on-surface-variant">{req.module}</TableCell>
            <TableCell>
              <Badge variant={req.priority.toLowerCase() as BadgeVariant}>{req.priority}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={requirementStatusVariant(req.status)}>{req.status}</Badge>
            </TableCell>
            <TableCell className="text-on-surface-variant">{req.type}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </DataTable>
  );
}
