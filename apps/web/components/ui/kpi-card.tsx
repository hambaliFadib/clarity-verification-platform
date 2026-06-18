import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  valueColor?: string;
  hoverBorderColor?: string;
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-primary",
  valueColor = "text-on-surface",
  hoverBorderColor = "hover:border-primary",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-card/70 backdrop-blur-sm border border-outline-variant p-5 rounded-lg flex justify-between items-start shadow-subtle hover-lift transition-all duration-200",
        hoverBorderColor,
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-label-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className={cn("text-headline-md font-bold", valueColor)}>
          {value}
        </span>
      </div>
      {Icon && (
        <div className={cn("p-2 rounded-md bg-surface-container-low", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
