"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select, Input } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import type { TestCaseSeverity, TestCaseType } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";

export interface TestCaseAdvancedFilters {
  module: string;
  type: TestCaseType | "";
  severity: TestCaseSeverity | "";
  tags: string;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: TestCaseAdvancedFilters;
  onApply: (filters: TestCaseAdvancedFilters) => void;
}

function TagMultiSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/test-cases/tags")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailableTags(data);
      })
      .catch((err) => console.error("Failed to fetch tags:", err));
  }, []);

  const selectedTags = value.split(',').map(t => t.trim()).filter(Boolean);

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      onChange(newTags.join(","));
    }
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(t => t !== tagToRemove);
    onChange(newTags.join(","));
  };

  const filteredTags = availableTags.filter(t =>
    t.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(t)
  );

  return (
    <div className="relative">
      <div
        className="min-h-[42px] w-full border border-outline-variant rounded-lg px-3 py-1.5 bg-white focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-fixed-dim transition-all flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map(tag => (
          <Badge key={tag} variant="neutral" className="flex items-center gap-1 pl-2 pr-1 py-0 h-6">
            <span className="text-[11px] truncate max-w-[100px] font-medium">{tag}</span>
            <button
              type="button"
              className="text-on-surface-variant hover:text-error rounded-full p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          className="flex-1 bg-transparent border-none outline-none min-w-[60px] text-body-sm h-7"
          placeholder={selectedTags.length === 0 ? "Select or type tags..." : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputValue.trim()) {
              e.preventDefault();
              handleAddTag(inputValue.trim());
            } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
              handleRemoveTag(selectedTags[selectedTags.length - 1]);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <ChevronDown className="h-4 w-4 text-on-surface-variant/60 ml-auto flex-shrink-0" />
      </div>

      {isOpen && (inputValue.trim() || filteredTags.length > 0 || availableTags.length === 0) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-outline-variant rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {inputValue.trim() && !filteredTags.find(t => t.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <div
              className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low text-primary font-medium"
              onMouseDown={(e) => { e.preventDefault(); handleAddTag(inputValue.trim()); }}
            >
              Add "{inputValue.trim()}"
            </div>
          )}
          {filteredTags.map(tag => (
            <div
              key={tag}
              className="px-3 py-2 text-body-sm cursor-pointer hover:bg-surface-container-low"
              onMouseDown={(e) => { e.preventDefault(); handleAddTag(tag); }}
            >
              {tag}
            </div>
          ))}
          {filteredTags.length === 0 && !inputValue.trim() && availableTags.length > 0 && (
            <div className="px-3 py-2 text-body-sm text-on-surface-variant italic">
              No matching tags
            </div>
          )}
          {availableTags.length === 0 && !inputValue.trim() && (
            <div className="px-3 py-2 text-body-sm text-on-surface-variant italic">
              No existing tags found
            </div>
          )}
        </div>
      )}
    </div>
  );
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
    const emptyFilters: TestCaseAdvancedFilters = { module: "", type: "", severity: "", tags: "" };
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

        <div>
          <Label>Tags</Label>
          <TagMultiSelect
            value={filters.tags}
            onChange={(val) => setFilters({ ...filters, tags: val })}
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
