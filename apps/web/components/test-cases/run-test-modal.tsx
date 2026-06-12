"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TestCase, TestStep } from "@/lib/types";

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />

      {/* Container */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-elevated flex flex-col max-h-[85vh] animate-scale-in border border-outline-variant">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-outline uppercase tracking-normal">
              Execute Run · {testCase.id}
            </span>
            <h2 className="text-title-md font-headline font-semibold text-on-surface">
              Run Test: {testCase.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-body-xs font-bold text-outline uppercase tracking-wide">
            Test Case Steps
          </div>
          <div className="divide-y divide-outline-variant/40 border border-outline-variant/60 rounded-xl overflow-hidden bg-surface-container-low/10">
            {steps.map((step, idx) => (
              <div key={idx} className="p-4 space-y-3 hover:bg-surface-container-low/20 transition-colors">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant shrink-0 mt-0.5">
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
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all ${
                        step.status === "Passed"
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" /> Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, "Failed")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all ${
                        step.status === "Failed"
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <XCircle className="h-3 w-3" /> Fail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(idx, "Blocked")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1 transition-all ${
                        step.status === "Blocked"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-white text-on-surface-variant border-outline-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <AlertTriangle className="h-3 w-3" /> Block
                    </button>
                  </div>
                </div>

                {step.status === "Failed" && (
                  <div className="pl-9 space-y-1">
                    <label className="block text-[11px] font-bold text-outline uppercase">
                      Actual Result *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Explain what actually happened..."
                      value={step.actualResult}
                      onChange={(e) => handleActualResultChange(idx, e.target.value)}
                      className="w-full border border-outline-variant rounded-lg px-3 py-1.5 text-body-sm bg-white focus:border-primary-container focus:outline-none transition-all"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || steps.some(s => s.status === "Failed" && !s.actualResult.trim())}>
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Saving...
              </>
            ) : (
              "Save Results"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
