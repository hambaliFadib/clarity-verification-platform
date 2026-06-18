"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StatusTab {
  label: string;
  count: number;
  value: string;
}

interface StatusTabsProps {
  tabs: StatusTab[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function StatusTabs({ tabs, defaultValue, onChange, className }: StatusTabsProps) {
  const [active, setActive] = useState(defaultValue || tabs[0]?.value || "");

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => {
            setActive(tab.value);
            onChange?.(tab.value);
          }}
          className={cn(
            "px-4 py-1.5 rounded-full text-body-sm font-medium flex items-center gap-2 transition-all duration-300 relative overflow-hidden group",
            active === tab.value
              ? "bg-primary text-white shadow-md transform scale-105"
              : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-transparent hover:border-outline-variant"
          )}
        >
          {active === tab.value && (
            <span className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></span>
          )}
          <span className="relative z-10">{tab.label}</span>
          <span
            className={cn(
              "px-1 text-label-sm font-bold text-center transition-colors duration-300 relative z-10",
              active === tab.value
                ? "text-white/80"
                : "text-on-surface-variant group-hover:text-primary"
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
