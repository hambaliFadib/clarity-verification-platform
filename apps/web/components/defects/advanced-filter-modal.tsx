"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdvancedFilters {
  severity: string;
  type: string;
  priority: string;
  tags: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
}

export function AdvancedFilterModal({ isOpen, onClose, currentFilters, onApply }: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<AdvancedFilters>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters = { severity: "", type: "", priority: "", tags: "" };
    setFilters(emptyFilters);
    onApply(emptyFilters);
    onClose();
  };

  const selectClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-elevated flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">Advanced Filters</h2>
          <button onClick={onClose} className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="Bug">Bug</option>
              <option value="Enhancement">Enhancement</option>
              <option value="Task">Task</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
              className={selectClass}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-outline-variant flex justify-between bg-surface-container-low/30 rounded-b-2xl">
          <Button variant="ghost" onClick={handleReset}>Reset</Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </div>
      </div>
    </div>
  );
}
