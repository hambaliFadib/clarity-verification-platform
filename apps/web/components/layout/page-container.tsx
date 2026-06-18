import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  /** Layout width variant */
  variant?: "default" | "wide" | "full";
  className?: string;
}

const variantClasses = {
  default: "max-w-page mx-auto",   /* 1280px */
  wide: "max-w-page-wide mx-auto", /* 1536px */
  full: "w-full",
};

/**
 * Standardized page content wrapper.
 * Provides consistent padding, max-width, and vertical spacing.
 *
 * - `default` (1280px) — most pages
 * - `wide` (1536px) — dashboard/analytics pages
 * - `full` — kanban boards, full-bleed layouts
 */
export function PageContainer({ children, variant = "default", className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "p-6 space-y-6 animate-fade-in",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
