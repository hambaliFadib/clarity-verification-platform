"use client";

import Link from "next/link";
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
            <th className="p-4 py-3">ID</th>
            <th className="p-4 py-3">Title</th>
            <th className="p-4 py-3">Module</th>
            <th className="p-4 py-3">Priority</th>
            <th className="p-4 py-3">Status</th>
            <th className="p-4 py-3">Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/50">
          {requirements.map((req) => (
            <tr key={req.id} className="hover:bg-surface-container-low transition-colors">
              <td className="p-4">
                <Link href={`/requirements/${req.id}`} className="font-medium text-primary hover:underline">
                  {req.displayId}
                </Link>
              </td>
              <td className="p-4 font-medium text-on-surface">{req.title}</td>
              <td className="p-4 text-on-surface-variant">{req.module}</td>
              <td className="p-4">
                <Badge variant={req.priority.toLowerCase() as BadgeVariant}>{req.priority}</Badge>
              </td>
              <td className="p-4">
                <Badge variant={requirementStatusVariant(req.status)}>{req.status}</Badge>
              </td>
              <td className="p-4 text-on-surface-variant">{req.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
