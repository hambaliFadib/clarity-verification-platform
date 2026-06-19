"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import type { TestCaseSeverity, TestCaseType } from "@/lib/types";



export interface TestCaseAdvancedFilters {
  module: string;
  type: TestCaseType | "";
  severity: TestCaseSeverity | "";
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: TestCaseAdvancedFilters;
  onApply: (filters: TestCaseAdvancedFilters) => void;
}



export function AdvancedFilterModal({ isOpen, onClose, currentFilters, onApply }: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<TestCaseAdvancedFilters>(currentFilters);
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/test-cases/modules")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAvailableModules(data);
          }
        })
        .catch((err) => console.error("Failed to fetch modules:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const emptyFilters: TestCaseAdvancedFilters = { module: "", type: "", severity: "" };
    setFilters(emptyFilters);
    onApply(emptyFilters);
    onClose();
  };

  const testCaseTypes: TestCaseType[] = ["Functional", "Regression", "Smoke", "Integration", "UI", "Performance", "Security"];
  const severities: TestCaseSeverity[] = ["Blocker", "Critical", "Major", "Minor"];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Advanced Filters</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div>
          <Label>Module</Label>
          <Combobox
            value={filters.module}
            onChange={(val) => setFilters({ ...filters, module: val })}
            options={availableModules}
            placeholder="Select or type module..."
          />
        </div>

        <div>
          <Label>Type</Label>
          <Select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as TestCaseType | "" })}
          >
            <option value="">All</option>
            {testCaseTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Severity</Label>
          <Select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value as TestCaseSeverity | "" })}
          >
            <option value="">All</option>
            {severities.map((severity) => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </Select>
        </div>


      </ModalBody>

      <ModalFooter className="justify-between">
        <Button variant="ghost" onClick={handleReset}>Reset</Button>
        <Button onClick={handleApply}>Apply Filters</Button>
      </ModalFooter>
    </Modal>
  );
}
