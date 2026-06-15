"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
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
    return (
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-subtle p-12 text-center">
        <BookOpen className="h-10 w-10 text-outline mx-auto mb-3 opacity-50" />
        <h3 className="text-body-lg font-semibold text-on-surface">No requirements found</h3>
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-subtle">
      <table className="w-full text-left text-body-sm">
        <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
          <tr>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">ID</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Title</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Module</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Priority</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Status</th>
            <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {requirements.map((req) => (
            <tr
              key={req.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/requirements/${req.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/requirements/${req.id}`);
                }
              }}
              className="hover:bg-surface-container-low transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
            >
              <td className="px-4 py-3 font-mono text-code text-primary-container font-medium">
                {req.displayId}
              </td>
              <td className="px-4 py-3 text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
                {req.title}
              </td>
              <td className="px-4 py-3 text-body-sm text-on-surface-variant">{req.module}</td>
              <td className="px-4 py-3">
                <Badge variant={req.priority.toLowerCase() as BadgeVariant}>{req.priority}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={requirementStatusVariant(req.status)}>{req.status}</Badge>
              </td>
              <td className="px-4 py-3 text-body-sm text-on-surface-variant">{req.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
