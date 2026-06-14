"use client";

import type { Requirement } from "@/lib/types";

interface RequirementSidebarProps {
  requirement: Requirement;
}

export function RequirementSidebar({ requirement }: RequirementSidebarProps) {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <h3 className="text-body-lg font-semibold mb-4">Details</h3>
      <div className="space-y-4 text-body-sm">
        <div className="flex justify-between">
          <span className="text-outline">Module</span>
          <span className="font-medium">{requirement.module}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Type</span>
          <span className="font-medium">{requirement.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Priority</span>
          <span className="font-medium">{requirement.priority}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-outline">Status</span>
          <span className="font-medium">{requirement.status}</span>
        </div>
      </div>
    </div>
  );
}
