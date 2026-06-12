"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestCase } from "@/lib/types";

interface LinkTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyLinked: string[];
  onLink: (selectedTestCaseIds: string[]) => void | Promise<void>;
  testCases?: TestCase[];
}

export function LinkTestCaseModal({
  isOpen,
  onClose,
  alreadyLinked,
  onLink,
  testCases = [],
}: LinkTestCaseModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const availableTestCases = testCases.filter(tc => !alreadyLinked.includes(tc.id));

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleLink = async () => {
    await onLink(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-elevated flex flex-col max-h-[85vh] animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 className="text-headline-sm font-headline font-semibold text-on-surface">Link Test Cases</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">Select test cases to link to this defect.</p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {availableTestCases.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-body-md">
              No available test cases to link.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/50">
              {availableTestCases.map(tc => (
                <label key={tc.id} className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors cursor-pointer rounded-lg">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    checked={selected.has(tc.id)}
                    onChange={() => toggleSelect(tc.id)}
                  />
                  <div>
                    <div className="font-mono text-code text-primary-container mb-1">{tc.id}</div>
                    <div className="text-body-md text-on-surface font-medium">{tc.title}</div>
                    <div className="text-body-sm text-on-surface-variant mt-1">{tc.module}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-low/30 rounded-b-2xl">
          <span className="text-body-sm text-on-surface-variant font-medium">
            {selected.size} selected
          </span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleLink} disabled={selected.size === 0}>
              Link Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
