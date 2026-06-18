"use client";

import { TestTube2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Make sure to match the type definition used elsewhere
export interface TestCaseNode {
  id: string;
  displayId: string;
  title: string;
  status: "Draft" | "Ready" | "In Review" | "Approved";
  severity: "Critical" | "High" | "Medium" | "Low";
  type: string;
  assignedTo?: string;
}

interface TestCaseRowProps {
  testCase: TestCaseNode;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  "Draft": "bg-surface-container-high text-on-surface-variant",
  "Ready": "bg-success/10 text-success border-success/20",
  "In Review": "bg-warning/10 text-warning border-warning/20",
  "Approved": "bg-primary/10 text-primary border-primary/20",
};

const severityStyles: Record<string, string> = {
  "Critical": "text-error",
  "High": "text-orange-500",
  "Medium": "text-warning",
  "Low": "text-on-surface-variant",
};

export function TestCaseRow({ testCase, onClick }: TestCaseRowProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 ml-6 hover:bg-surface-container-low rounded-md cursor-pointer transition-colors group"
      onClick={onClick}
    >
      {/* Icon */}
      <TestTube2 className="h-3.5 w-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />

      {/* ID */}
      <span className="text-body-sm text-on-surface-variant font-mono w-24">
        {testCase.displayId}
      </span>

      {/* Title */}
      <span className="text-body-sm text-on-surface flex-1 truncate group-hover:text-primary transition-colors">
        {testCase.title}
      </span>

      {/* Severity */}
      <span className={cn("text-body-sm font-medium w-16", severityStyles[testCase.severity])}>
        {testCase.severity}
      </span>

      {/* Status Badge */}
      <Badge
        variant="outline"
        className={cn("text-[10px] px-2 py-0 border", statusStyles[testCase.status])}
      >
        {testCase.status}
      </Badge>
    </div>
  );
}
