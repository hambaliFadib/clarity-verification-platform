import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-label-bold text-label-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary-container text-white hover:bg-primary shadow-subtle hover:shadow-card",
        secondary: "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container-low hover:border-outline",
        ghost: "text-on-surface-variant hover:bg-surface-container-low",
        destructive: "bg-error text-on-error hover:bg-red-700",
        outline: "border border-outline-variant text-on-surface hover:bg-surface-container-low",
        link: "text-primary-container underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        md: "h-9 px-4",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
