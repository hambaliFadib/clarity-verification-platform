"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader onClose={onClose}>
        <div>
          <ModalTitle>Link Test Cases</ModalTitle>
          <p className="text-body-sm text-muted-foreground mt-1">Select test cases to link to this defect.</p>
        </div>
      </ModalHeader>

      <ModalBody className="overflow-y-auto max-h-[50vh] p-2">
        {availableTestCases.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-body-md">
            No available test cases to link.
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/50">
            {availableTestCases.map(tc => (
              <label key={tc.id} className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors cursor-pointer rounded-md">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={selected.has(tc.id)}
                  onChange={() => toggleSelect(tc.id)}
                />
                <div>
                  <div className="font-mono text-code text-primary-container mb-1">{tc.id}</div>
                  <div className="text-body-md text-on-surface font-medium">{tc.title}</div>
                  <div className="text-body-sm text-muted-foreground mt-1">{tc.module}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="justify-between">
        <span className="text-body-sm text-muted-foreground font-medium">
          {selected.size} selected
        </span>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleLink} disabled={selected.size === 0}>
            Link Selected
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
