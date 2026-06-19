"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import type { TestCaseSeverity, TestCaseType } from "@/lib/types";

export interface TestCaseAdvancedFilters {
  module: string;
  type: TestCaseType | "";
  severity: TestCaseSeverity | "";
  category: "Positive" | "Negative" | "";
  assigned: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: TestCaseAdvancedFilters;
  onApply: (filters: TestCaseAdvancedFilters) => void;
}

const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Functional", value: "Functional" },
  { label: "Regression", value: "Regression" },
  { label: "Smoke", value: "Smoke" },
  { label: "Integration", value: "Integration" },
  { label: "UI", value: "UI" },
  { label: "Performance", value: "Performance" },
  { label: "Security", value: "Security" },
];

const SEVERITY_OPTIONS = [
  { label: "All Severities", value: "" },
  { label: "Blocker", value: "Blocker" },
  { label: "Critical", value: "Critical" },
  { label: "Major", value: "Major" },
  { label: "Minor", value: "Minor" },
];

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Positive", value: "Positive" },
  { label: "Negative", value: "Negative" },
];

export function AdvancedFilterModal({ isOpen, onClose, currentFilters, onApply }: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<TestCaseAdvancedFilters>(currentFilters);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/test-cases/modules")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableModules(data.map((m: any) => m.name));
          }
        })
        .catch((err) => console.error("Failed to fetch modules:", err));

      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableUsers(data.map((u: any) => u.name));
          }
        })
        .catch((err) => console.error("Failed to fetch users:", err));
    }
  }, [isOpen]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: TestCaseAdvancedFilters = { module: "", type: "", severity: "", category: "", assigned: "" };
    setFilters(emptyFilters);
    onApply(emptyFilters);
    onClose();
  };

  const activeCount = [
    filters.module,
    filters.type,
    filters.severity,
    filters.category,
    filters.assigned,
  ].filter(Boolean).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
        <ModalTitle>
          Filter Test Cases
          {activeCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary text-on-primary rounded-full">
              {activeCount}
            </span>
          )}
        </ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Module */}
        <div>
          <Label>Module</Label>
          <Combobox
            value={filters.module}
            onChange={(val) => setFilters({ ...filters, module: val })}
            options={availableModules}
            placeholder="Select or type module..."
          />
        </div>

        {/* Type */}
        <div>
          <Label>Type</Label>
          <Select
            value={filters.type}
            onChange={(val) => setFilters({ ...filters, type: val as TestCaseType | "" })}
            options={TYPE_OPTIONS}
          />
        </div>

        {/* Severity */}
        <div>
          <Label>Severity</Label>
          <Select
            value={filters.severity}
            onChange={(val) => setFilters({ ...filters, severity: val as TestCaseSeverity | "" })}
            options={SEVERITY_OPTIONS}
          />
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <Select
            value={filters.category}
            onChange={(val) => setFilters({ ...filters, category: val as "Positive" | "Negative" | "" })}
            options={CATEGORY_OPTIONS}
          />
        </div>

        {/* Assigned To */}
        <div>
          <Label>Assigned To</Label>
          <Combobox
            value={filters.assigned}
            onChange={(val) => setFilters({ ...filters, assigned: val })}
            options={availableUsers}
            placeholder="Select or type assignee..."
            openUpward
          />
        </div>
      </ModalBody>

      <ModalFooter className="justify-between">
        <Button variant="ghost" onClick={handleReset}>Reset All</Button>
        <Button onClick={handleApply}>Apply Filters</Button>
      </ModalFooter>
    </Modal>
  );
}
