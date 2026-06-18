import * as React from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────
   Label
   ────────────────────────────────────────────────── */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("block text-label-md font-medium text-on-surface-variant mb-1.5", className)}
    {...props}
  />
));
Label.displayName = "Label";

/* ──────────────────────────────────────────────────
   Input
   ────────────────────────────────────────────────── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-outline-variant bg-card px-3 py-2 text-body-md text-on-surface",
      "placeholder:text-outline",
      "focus:border-primary-container focus:ring-1 focus:ring-ring focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-all",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ──────────────────────────────────────────────────
   Select
   ────────────────────────────────────────────────── */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-outline-variant bg-card px-3 py-2 text-body-md text-on-surface",
      "focus:border-primary-container focus:ring-1 focus:ring-ring focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-all",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* ──────────────────────────────────────────────────
   Textarea
   ────────────────────────────────────────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-md border border-outline-variant bg-card px-3 py-2 text-body-md text-on-surface",
      "placeholder:text-outline",
      "focus:border-primary-container focus:ring-1 focus:ring-ring focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "resize-y transition-all",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ──────────────────────────────────────────────────
   FormMessage
   ────────────────────────────────────────────────── */
export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(({ className, children, ...props }, ref) => {
  if (!children) return null;
  return (
    <p ref={ref} className={cn("text-caption text-danger mt-1.5", className)} {...props}>
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export { Label, Input, Select, Textarea, FormMessage };
