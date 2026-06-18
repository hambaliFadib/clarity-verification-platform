import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-1.5 h-5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      variant: {
        /* Semantic status */
        neutral: "bg-slate-100 text-slate-600 border border-slate-200",
        success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        warning: "bg-amber-100 text-amber-800 border border-amber-200",
        danger: "bg-red-100 text-red-700 border border-red-200",
        info: "bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim/30",

        /* Priority / Severity */
        critical: "bg-red-500 text-white",
        high: "bg-orange-500 text-white",
        medium: "bg-amber-100 text-amber-800 border border-amber-200",
        low: "bg-slate-100 text-slate-600 border border-slate-200",

        /* Defect status */
        open: "bg-error-container text-on-error-container",
        "in-progress": "bg-surface-container-highest text-on-surface-variant",
        resolved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        closed: "bg-secondary-container text-on-secondary-container",
        blocked: "bg-red-100 text-red-700 border border-red-200",
        reopened: "bg-purple-100 text-purple-700 border border-purple-200",

        /* Test case status */
        draft: "bg-slate-100 text-slate-500 border border-slate-200",
        ready: "bg-blue-100 text-blue-700 border border-blue-200",
        "in-review": "bg-amber-50 text-amber-700 border border-amber-200",
        approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        obsolete: "bg-slate-200 text-slate-500",

        /* Execution status */
        passed: "bg-emerald-100 text-emerald-700",
        failed: "bg-red-100 text-red-700",
        "not-run": "bg-slate-100 text-slate-500",
        skipped: "bg-yellow-100 text-yellow-700",

        /* Test case types */
        functional: "bg-blue-50 text-blue-600 border border-blue-100",
        regression: "bg-violet-50 text-violet-600 border border-violet-100",
        smoke: "bg-cyan-50 text-cyan-700 border border-cyan-100",
        ui: "bg-pink-50 text-pink-600 border border-pink-100",
        performance: "bg-orange-50 text-orange-600 border border-orange-100",
        security: "bg-red-50 text-red-600 border border-red-100",
        integration: "bg-indigo-50 text-indigo-600 border border-indigo-100",

        /* General */
        primary: "bg-primary-container text-white",
        outline: "bg-transparent text-on-surface-variant border border-outline-variant",
      },
    },
    defaultVariants: { variant: "outline" },
  }
);

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
