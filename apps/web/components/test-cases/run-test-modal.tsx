"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/lib/types";

interface RunTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCase;
  onSave: (updatedSteps: any[]) => Promise<void>;
}

export function RunTestModal({ isOpen, onClose, testCase, onSave }: RunTestModalProps) {
  const [steps, setSteps] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSteps(
        testCase.steps.map((step) => ({
          stepNumber: step.stepNumber,
          action: step.action,
          status: step.status || "Not Run",
          actualResult: step.actualResult || "",
        }))
      );
    }
  }, [isOpen, testCase]);

  if (!isOpen) return null;

  const handleStatusChange = (index: number, status: string) => {
    const next = [...steps];
    next[index].status = status;
    if (status !== "Failed") {
      next[index].actualResult = "";
    }
    setSteps(next);
  };

  const handleActualResultChange = (index: number, val: string) => {
    const next = [...steps];
    next[index].actualResult = val;
    setSteps(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(steps);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save execution results.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" preventClose={saving}>
      <ModalHeader onClose={onClose} closeDisabled={saving}>
        <div className="space-y-1">
          <span className="text-label-sm font-mono text-outline uppercase tracking-wide">
            Execute Run · {testCase.id}
          </span>
          <ModalTitle>Run Test: {testCase.title}</ModalTitle>
        </div>
      </ModalHeader>

      <ModalBody className="overflow-y-auto max-h-[55vh] space-y-4">
        <div className="text-label-sm font-semibold text-outline uppercase tracking-wide">
          Test Case Steps
        </div>
        <div className="divide-y divide-outline-variant/40 border border-outline-variant/60 rounded-lg overflow-hidden bg-surface-container-low/10">
          {steps.map((step, idx) => (
            <div key={idx} className="p-4 space-y-3 hover:bg-surface-container-low/20 transition-colors">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-label-sm font-semibold text-on-surface-variant shrink-0 mt-0.5">
                    {step.stepNumber}
                  </div>
                  <span className="text-body-sm text-on-surface leading-normal">
                    {step.action}
                  </span>
                </div>

                {/* Status buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, "Passed")}
                    className={cn(
                      "px-2.5 py-1 text-caption font-medium rounded-md border flex items-center gap-1 transition-all",
                      step.status === "Passed"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : "bg-card text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, "Failed")}
                    className={cn(
                      "px-2.5 py-1 text-caption font-medium rounded-md border flex items-center gap-1 transition-all",
                      step.status === "Failed"
                        ? "bg-red-500 text-white border-red-500 shadow-sm"
                        : "bg-card text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                    )}
                  >
                    <XCircle className="h-3 w-3" /> Fail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(idx, "Blocked")}
                    className={cn(
                      "px-2.5 py-1 text-caption font-medium rounded-md border flex items-center gap-1 transition-all",
                      step.status === "Blocked"
                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : "bg-card text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                    )}
                  >
                    <AlertTriangle className="h-3 w-3" /> Block
                  </button>
                </div>
              </div>

              {step.status === "Failed" && (
                <div className="pl-9 space-y-1">
                  <Label className="text-label-sm">Actual Result *</Label>
                  <Input
                    required
                    placeholder="Explain what actually happened..."
                    value={step.actualResult}
                    onChange={(e) => handleActualResultChange(idx, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={saving} disabled={saving || steps.some(s => s.status === "Failed" && !s.actualResult.trim())}>
          Save Results
        </Button>
      </ModalFooter>
    </Modal>
  );
}
