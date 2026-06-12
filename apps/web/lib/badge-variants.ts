import type { BadgeVariant } from "@/components/ui/badge";

export const priorityBadgeVariants = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
} as const satisfies Record<string, BadgeVariant>;

export const severityBadgeVariants = priorityBadgeVariants;

export const testCaseSeverityBadgeVariants = {
  Blocker: "critical",
  Critical: "high",
  Major: "medium",
  Minor: "low",
} as const satisfies Record<string, BadgeVariant>;

export const testCaseStatusBadgeVariants = {
  Draft: "draft",
  Ready: "ready",
  "In Review": "in-review",
  Approved: "approved",
  Obsolete: "obsolete",
} as const satisfies Record<string, BadgeVariant>;

export const testCaseTypeBadgeVariants = {
  Functional: "functional",
  Regression: "regression",
  Smoke: "smoke",
  Integration: "integration",
  UI: "ui",
  Performance: "performance",
  Security: "security",
} as const satisfies Record<string, BadgeVariant>;

export const releaseStatusBadgeVariants = {
  Planning: "draft",
  "In Progress": "in-progress",
  Ready: "ready",
  Released: "approved",
  Cancelled: "obsolete",
} as const satisfies Record<string, BadgeVariant>;

export const environmentTypeBadgeVariants = {
  Development: "info",
  Staging: "in-review",
  Production: "primary",
  QA: "functional",
  UAT: "outline",
} as const satisfies Record<string, BadgeVariant>;

export const environmentStatusBadgeVariants = {
  Active: "passed",
  Inactive: "draft",
  Maintenance: "in-review",
} as const satisfies Record<string, BadgeVariant>;

export const roleBadgeVariants = {
  Admin: "primary",
  "QA Lead": "info",
  "QA Engineer": "functional",
  Developer: "outline",
  Contributor: "ready",
  Viewer: "draft",
} as const satisfies Record<string, BadgeVariant>;

export function getDefectStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "Open":
      return "open";
    case "In Progress":
      return "in-progress";
    case "Resolved":
      return "resolved";
    case "Closed":
      return "closed";
    case "Blocked":
      return "blocked";
    case "Reopened":
      return "reopened";
    default:
      return "outline";
  }
}
