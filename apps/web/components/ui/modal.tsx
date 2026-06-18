"use client";

import { useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Prevent closing on backdrop click (e.g. during async operations) */
  preventClose?: boolean;
  /** Max width class. Defaults to "max-w-lg" */
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export function Modal({ isOpen, onClose, children, preventClose, size = "lg", className }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, mounted]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || preventClose) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, preventClose, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md"
        onClick={preventClose ? undefined : onClose}
      />
      {/* Container */}
      <div
        className={cn(
          "relative bg-card w-full rounded-xl shadow-float flex flex-col overflow-hidden animate-scale-in border border-outline-variant",
          sizeClasses[size],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ──────────────────────────────────────────────────
   Modal sub-components
   ────────────────────────────────────────────────── */

interface ModalHeaderProps {
  children: ReactNode;
  onClose?: () => void;
  closeDisabled?: boolean;
  className?: string;
}

export function ModalHeader({ children, onClose, closeDisabled, className }: ModalHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-6 py-4 border-b border-outline-variant", className)}>
      <div className="flex items-center gap-2 min-w-0">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface ModalTitleProps {
  children: ReactNode;
  className?: string;
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn("text-headline-sm font-semibold text-on-surface", className)}>
      {children}
    </h2>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30", className)}>
      {children}
    </div>
  );
}
