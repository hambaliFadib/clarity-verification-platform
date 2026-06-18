"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Advanced Filters</ModalTitle>
      </ModalHeader>

      <ModalBody className="space-y-4">
        <div>
          <Label>Severity</Label>
          <Combobox
            value={filters.severity}
            onChange={(val) => setFilters({ ...filters, severity: val })}
            options={["Critical", "High", "Medium", "Low"]}
            placeholder="All"
          />
        </div>

        <div>
          <Label>Type</Label>
          <Combobox
            value={filters.type}
            onChange={(val) => setFilters({ ...filters, type: val })}
            options={["Bug", "Enhancement", "Task"]}
            placeholder="All"
          />
        </div>

        <div>
          <Label>Priority</Label>
          <Combobox
            value={filters.priority}
            onChange={(val) => setFilters({ ...filters, priority: val })}
            options={["Critical", "High", "Medium", "Low"]}
            placeholder="All"
          />
        </div>

        <div>
          <Label>Tags</Label>
          <Input
            placeholder="Filter by tags..."
            value={filters.tags}
            onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
          />
        </div>
      </ModalBody>

      <ModalFooter className="justify-between">
        <Button variant="ghost" onClick={handleReset}>Reset</Button>
        <Button onClick={handleApply}>Apply Filters</Button>
      </ModalFooter>
    </Modal>
  );
}
