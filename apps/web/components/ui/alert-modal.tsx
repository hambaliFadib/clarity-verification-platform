"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type,
}: AlertModalProps) {
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

  if (!isOpen || !mounted) return null;

  const typeConfig = {
    success: {
      bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
      icon: <CheckCircle2 className="h-10 w-10" />,
      btnTheme: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    },
    error: {
      bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30",
      icon: <XCircle className="h-10 w-10" />,
      btnTheme: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    },
    warning: {
      bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
      icon: <AlertTriangle className="h-10 w-10" />,
      btnTheme: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    info: {
      bg: "bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400 border-sky-100 dark:border-sky-900/30",
      icon: <Info className="h-10 w-10" />,
      btnTheme: "bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500",
    },
  };

  const config = typeConfig[type];

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop blur */}
      <div
        className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-float flex flex-col items-center p-6 overflow-hidden animate-scale-in border border-outline-variant text-center">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Circular Icon Glow Container */}
        <div className={cn("p-4 rounded-full border mb-4 mt-2 flex items-center justify-center shadow-subtle", config.bg)}>
          {config.icon}
        </div>

        {/* Text Details */}
        <h3 className="text-headline-sm font-headline font-semibold text-on-surface">
          {title}
        </h3>
        <p className="text-body-md text-on-surface-variant mt-2 mb-6 max-w-xs">
          {message}
        </p>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className={cn("w-full h-10 font-semibold text-body-md rounded-xl transition-all shadow-subtle", config.btnTheme)}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
