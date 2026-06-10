import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start", className)}>
      <div className="flex flex-col gap-1">
        {badge && <div className="flex items-center gap-2 mb-0.5">{badge}</div>}
        <h1 className="text-headline-md font-headline font-semibold text-on-surface">{title}</h1>
        {subtitle && <p className="text-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
