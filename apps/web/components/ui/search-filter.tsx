"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFilterProps {
  placeholder?: string;
  className?: string;
}

export function SearchFilter({ placeholder = "Search...", className }: SearchFilterProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <div className="flex-1 bg-white border border-outline-variant rounded-lg px-3 py-2 flex items-center gap-2 focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-fixed-dim transition-all">
        <Search className="h-4 w-4 text-outline flex-shrink-0" />
        <input
          className="w-full bg-transparent border-none focus:outline-none text-body-sm text-on-surface placeholder:text-outline"
          placeholder={placeholder}
          type="text"
        />
      </div>
      <button
        className="bg-white border border-outline-variant rounded-lg px-4 py-2 text-label-bold font-label-bold flex items-center gap-2 hover:bg-surface-container-low hover:border-outline transition-all"
        type="button"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Add filter
      </button>
    </div>
  );
}
