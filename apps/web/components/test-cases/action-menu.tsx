"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ActionMenuProps {
  items: MenuItem[];
  onOpen?: () => void;
}

export function ActionMenu({ items, onOpen }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          if (newIsOpen) onOpen?.();
        }}
        className="p-1.5 rounded-md hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Actions"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-on-surface-variant" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-outline-variant z-50 py-1 overflow-hidden">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                item.variant === "danger"
                  ? "text-error hover:bg-error/10"
                  : "text-on-surface hover:bg-surface-container-low"
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                item.variant === "danger" ? "text-error" : "text-on-surface-variant"
              )}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
