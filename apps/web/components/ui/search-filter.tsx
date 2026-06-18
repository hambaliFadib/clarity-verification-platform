"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActiveFilter {
  label: string;
  value: string;
  key: string;
}

interface SearchFilterProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onAddFilterClick?: () => void;
  activeFilterCount?: number;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (key: string) => void;
  onResetFilters?: () => void;
}

export function SearchFilter({
  placeholder = "Search...",
  className,
  value,
  onChange,
  onAddFilterClick,
  activeFilterCount = 0,
  activeFilters = [],
  onRemoveFilter,
  onResetFilters,
}: SearchFilterProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <div className="flex-1 bg-card border border-outline-variant rounded-md px-3 flex items-center gap-2 h-10 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-ring transition-all">
          <Search className="h-4 w-4 text-outline flex-shrink-0" />
          <input
            className="w-full bg-transparent border-none focus:outline-none text-body-md text-on-surface placeholder:text-outline"
            placeholder={placeholder}
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        </div>
        {onAddFilterClick && (
          <button
            className={cn(
              "border rounded-md px-4 h-10 text-body-md font-medium flex items-center gap-2 transition-all relative",
              activeFilterCount > 0
                ? "bg-primary-container text-white border-primary-container hover:bg-primary-container/90"
                : "bg-card border-outline-variant hover:bg-surface-container-low hover:border-outline",
            )}
            type="button"
            onClick={onAddFilterClick}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-white text-primary-container text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap animate-fade-in">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 bg-primary-fixed/30 text-primary-container border border-primary-fixed-dim/40 rounded-full px-3 py-1 text-[11px] font-semibold"
            >
              <span className="text-on-surface-variant font-normal">{filter.label}:</span>
              {filter.value}
              <button
                type="button"
                onClick={() => onRemoveFilter?.(filter.key)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-primary-container/10 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-error hover:text-error/80 transition-colors ml-1"
          >
            Reset all
          </button>
        </div>
      )}
    </div>
  );
}
