"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Play, Check, X, SkipForward, Camera, Bug } from "lucide-react";
import { ReportDefectModal } from "@/components/defects/report-defect-modal";
import type { Defect, TestCase } from "@/lib/types";

interface ExecutionRunnerProps {
  isOpen: boolean;
  onClose: () => void;
  testCases: TestCase[];
  onTestCaseResult: (tcId: string, status: "Passed" | "Failed" | "Skipped") => Promise<void>;
  onComplete: () => void;
}

export function ExecutionRunner({ isOpen, onClose, testCases, onTestCaseResult, onComplete }: ExecutionRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentIndex(0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || testCases.length === 0 || !mounted) return null;

  const currentCase = testCases[currentIndex];

  const handleStatus = async (status: "Passed" | "Failed" | "Skipped") => {
    if (currentCase) {
      await onTestCaseResult(currentCase.id, status);
    }
    if (currentIndex < testCases.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }
    onComplete();
    onClose();
  };

  const handleLogDefect = async (defect: Defect) => {
    // In a real app, we'd post this to the API
    console.log("Logged defect:", defect);
    // Optionally automatically fail the test case when a defect is logged
    handleStatus("Failed");
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-elevated flex flex-col max-h-[90vh] animate-scale-in border border-outline-variant">
        <div className="px-6 py-4 border-b border-outline-variant">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-title-lg font-headline font-semibold text-on-surface">
                Executing: {currentCase?.title || `Test Case ${currentIndex + 1}`}
              </h2>
              <div className="text-sm text-outline mt-1">
                Step {currentIndex + 1} of {testCases.length}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-white shadow-none px-2.5 py-1 text-xs" onClick={() => handleStatus("Passed")}>
                <Check className="h-3.5 w-3.5" /> Pass
              </Button>
              <Button variant="outline" size="sm" className="text-error border-error/20 hover:bg-error/5 bg-white shadow-none px-2.5 py-1 text-xs" onClick={() => handleStatus("Failed")}>
                <X className="h-3.5 w-3.5" /> Fail
              </Button>
              <Button variant="outline" size="sm" className="text-primary border-outline-variant hover:bg-surface-container-low bg-white shadow-none px-2.5 py-1 text-xs" onClick={() => handleStatus("Skipped")}>
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </Button>
              <div className="w-px h-5 bg-outline-variant mx-1 self-center" />
              <Button variant="outline" size="sm" className="text-error border-error/20 hover:bg-error/5 bg-white shadow-none px-2.5 py-1 text-xs" onClick={() => setIsDefectModalOpen(true)}>
                <Bug className="h-3.5 w-3.5" /> Log Defect
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-on-surface-variant text-sm">
              {currentCase?.description || "Follow the test steps to verify functionality."}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Test Steps</h4>
            {currentCase?.steps?.length ? (
              currentCase.steps.map((step, index) => (
                <div key={`${step.action}-${index}`} className="flex gap-4 p-4 border border-outline-variant rounded-xl items-start bg-white">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="font-semibold text-sm">Action: </span>
                      <span className="text-sm text-on-surface-variant">{step.action}</span>
                    </div>
                    {step.expectedResult && (
                      <div>
                        <span className="font-semibold text-sm">Expected: </span>
                        <span className="text-sm text-on-surface-variant">{step.expectedResult}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-outline border border-outline-variant rounded-xl border-dashed">
                No explicit steps defined.
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex flex-col-reverse gap-3 bg-surface-container-low/30 rounded-b-2xl sm:flex-row sm:justify-between">
          <Button variant="outline">
            <Camera className="h-4 w-4" /> Capture Evidence
          </Button>
          <Button onClick={onClose} variant="ghost">
            <Play className="h-4 w-4" /> Abort Run
          </Button>
        </div>
      </div>

      <ReportDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        onSubmit={handleLogDefect}
        initialData={{
          title: `Failure in ${currentCase?.title}`,
          description: `Failed at step ${currentIndex + 1}\n\nSteps:\n${currentCase?.steps?.map((s, i) => `${i+1}. ${s.action}`).join('\n')}`,
          type: "Bug",
          status: "Open",
          severity: "High",
          linkedTestCase: currentCase?.id,
        } as unknown as Defect}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
}
