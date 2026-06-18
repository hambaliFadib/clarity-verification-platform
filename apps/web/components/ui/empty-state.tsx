import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("bg-card border border-outline-variant rounded-lg p-12 text-center shadow-subtle", className)}>
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className="h-10 w-10 text-outline opacity-50" />
        </div>
      )}
      <h3 className="text-body-lg font-semibold text-on-surface">{title}</h3>
      {description && <p className="text-body-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
