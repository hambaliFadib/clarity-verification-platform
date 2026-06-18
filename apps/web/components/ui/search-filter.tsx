"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onAddFilterClick?: () => void;
}

export function SearchFilter({
  placeholder = "Search...",
  className,
  value,
  onChange,
  onAddFilterClick
}: SearchFilterProps) {
  return (
    <div className={cn("flex gap-2", className)}>
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
          className="bg-card border border-outline-variant rounded-md px-4 h-10 text-body-md font-medium flex items-center gap-2 hover:bg-surface-container-low hover:border-outline transition-all"
          type="button"
          onClick={onAddFilterClick}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Add filter
        </button>
      )}
    </div>
  );
}
