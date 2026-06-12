"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: "bg-emerald-50/80 dark:bg-emerald-950/25",
      border: "border-emerald-500/30 dark:border-emerald-500/20",
      text: "text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
      bar: "bg-emerald-500",
    },
    error: {
      bg: "bg-rose-50/80 dark:bg-rose-950/25",
      border: "border-rose-500/30 dark:border-rose-500/20",
      text: "text-rose-800 dark:text-rose-300",
      icon: <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />,
      bar: "bg-rose-500",
    },
    warning: {
      bg: "bg-amber-50/80 dark:bg-amber-950/25",
      border: "border-amber-500/30 dark:border-amber-500/20",
      text: "text-amber-800 dark:text-amber-300",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
      bar: "bg-amber-500",
    },
    info: {
      bg: "bg-sky-50/80 dark:bg-sky-950/25",
      border: "border-sky-500/30 dark:border-sky-500/20",
      text: "text-sky-800 dark:text-sky-300",
      icon: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />,
      bar: "bg-sky-500",
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="alert"
      className={cn(
        "fixed top-4 right-4 z-[9999] max-w-sm w-full p-4 rounded-xl shadow-elevated border backdrop-blur-md transition-all duration-300 animate-slide-in-right flex items-start gap-3 overflow-hidden",
        config.bg,
        config.border,
        config.text
      )}
    >
      {config.icon}
      <div className="flex-1 text-body-sm font-medium pr-4 leading-normal">{message}</div>
      <button
        onClick={onClose}
        className="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
        <div
          className={cn("h-full transition-all duration-75 ease-linear", config.bar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
