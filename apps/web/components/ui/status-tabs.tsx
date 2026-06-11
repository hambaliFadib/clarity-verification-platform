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
            "px-4 py-1.5 rounded-full text-label-bold font-label-bold flex items-center gap-2 transition-all duration-150",
            active === tab.value
              ? "bg-primary-container text-white shadow-subtle"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          )}
        >
          {tab.label}
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center",
              active === tab.value
                ? "bg-white/20 text-white"
                : "bg-white text-on-surface-variant"
            )}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
