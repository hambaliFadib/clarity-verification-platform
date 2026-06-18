"use client";

import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody } from "@/components/ui/modal";
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
  const typeConfig = {
    success: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      icon: <CheckCircle2 className="h-10 w-10" />,
      btnTheme: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    },
    error: {
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      icon: <XCircle className="h-10 w-10" />,
      btnTheme: "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500",
    },
    warning: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      icon: <AlertTriangle className="h-10 w-10" />,
      btnTheme: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    info: {
      bg: "bg-sky-50 text-sky-600 border-sky-100",
      icon: <Info className="h-10 w-10" />,
      btnTheme: "bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-500",
    },
  };

  const config = typeConfig[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalBody className="flex flex-col items-center text-center">
        {/* Circular Icon Glow Container */}
        <div className={cn("p-4 rounded-full border mb-4 mt-2 flex items-center justify-center shadow-subtle", config.bg)}>
          {config.icon}
        </div>

        {/* Text Details */}
        <h3 className="text-headline-sm font-semibold text-on-surface">
          {title}
        </h3>
        <p className="text-body-md text-muted-foreground mt-2 mb-6 max-w-xs">
          {message}
        </p>

        {/* Close Button */}
        <Button
          onClick={onClose}
          className={cn("w-full h-10 font-semibold text-body-md rounded-lg transition-all shadow-subtle", config.btnTheme)}
        >
          Dismiss
        </Button>
      </ModalBody>
    </Modal>
  );
}
