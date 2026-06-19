"use client";

import { use, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  getDefectStatusBadgeVariant,
  priorityBadgeVariants,
  severityBadgeVariants,
  testCaseSeverityBadgeVariants,
  testCaseStatusBadgeVariants,
  testCaseTypeBadgeVariants,
} from "@/lib/badge-variants";
import type { Defect, TestCase } from "@/lib/types";
import { DeleteConfirmModal } from "@/components/test-cases/delete-confirm-modal";
import { AlertModal } from "@/components/ui/alert-modal";
import { ExecutionRunner } from "@/components/test-runs/execution-runner";

import { TCTraceabilityMatrix } from "@/components/test-cases/tc-traceability-matrix";

const tabs = ["Details", "Steps", "Traceability"];

const stepStatusIcon: Record<string, ReactNode> = {
  Passed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  Failed: <XCircle className="h-4 w-4 text-red-600" />,
  Blocked: <MinusCircle className="h-4 w-4 text-amber-600" />,
  "Not Run": <Clock className="h-4 w-4 text-slate-400" />,
  Skipped: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
};

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Details");
  const [tc, setTc] = useState<TestCase | null>(null);
  const [linkedDefects, setLinkedDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cloning, setCloning] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);

  const toggleStepExpand = (stepNumber: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType === "created") {
      setAlertState({
        isOpen: true,
        title: "Test Case Created",
        message: "The test case was created successfully.",
        type: "success",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    } else if (toastType === "updated") {
      setAlertState({
        isOpen: true,
        title: "Test Case Updated",
        message: "The test case details were updated successfully.",
        type: "success",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    } else if (toastType === "cloned") {
      setAlertState({
        isOpen: true,
        title: "Test Case Cloned",
        message: "The test case has been cloned successfully.",
        type: "success",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/test-cases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete testcase");
      setIsDeleteOpen(false);
      router.push("/test-cases?toast=deleted");
    } catch (err: any) {
      setAlertState({
        isOpen: true,
        title: "Deletion Failed",
        message: err.message || "An error occurred during deletion",
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async () => {
    if (cloning || !tc) return;
    setCloning(true);
    try {
      const clonedPayload = {
        title: `Copy of ${tc.title}`,
        description: tc.description || "",
        moduleId: tc.moduleId || null,
        subModuleId: tc.subModuleId || null,
        scenarioId: tc.scenarioId || null,
        type: tc.type,
        severity: tc.severity,
        status: "Draft",
        category: tc.category || "Positive",
        assignedTo: tc.assignedToId || null,
        requirementId: tc.requirementId || "",
        estimatedTime: tc.estimatedTime || "",
        environment: tc.environment || "",
        automationStatus: tc.automationStatus || "",
        preconditions: tc.preconditions || "",
        testSteps: tc.steps.map((step) => ({
          action: step.action,
          status: "Not Run",
        })),
        expectedResult: tc.expectedResult || "",
        notes: tc.notes || "",
      };
      
      const res = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clonedPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clone test case");
      router.push(`/test-cases/${data.testCase.id}?toast=cloned`);
    } catch (err: any) {
      setAlertState({
        isOpen: true,
        title: "Cloning Failed",
        message: err.message || "An error occurred during cloning",
        type: "error",
      });
    } finally {
      setCloning(false);
    }
  };

  useEffect(() => {
    async function loadTestCase() {
      try {
        const res = await fetch(`/api/test-cases/${id}`);
        if (!res.ok) {
          setError(`The test case "${id}" does not exist.`);
          return;
        }
        const data: TestCase = await res.json();
        setTc(data);

        const defectRes = await fetch(`/api/defects?search=${encodeURIComponent(data.id)}`, { cache: "no-store" });
        if (defectRes.ok) {
          const defectsData: Defect[] = await defectRes.json();
          setLinkedDefects(defectsData.filter((defect) => defect.linkedTestCase === data.id));
        }
      } catch (err) {
        setError("Failed to fetch test case details.");
      } finally {
        setLoading(false);
      }
    }
    loadTestCase();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading test case details...</div>
      </div>
    );
  }

  if (error || !tc) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Test Case Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">{error || `The test case "${id}" does not exist.`}</p>
        <Link href="/test-cases" className="text-primary-container hover:underline mt-4 inline-block">
          Back to Test Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in relative">
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
      />
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/test-cases");
          }
        }}
        className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Test Cases
      </button>

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="font-mono text-code text-primary-container">{tc.id}</span>
          <h1 className="text-headline-md font-headline font-semibold text-on-surface">{tc.title}</h1>
          <div className="flex gap-2">
              <Badge variant={testCaseStatusBadgeVariants[tc.status]}>{tc.status}</Badge>
              <Badge variant={testCaseSeverityBadgeVariants[tc.severity]}>{tc.severity}</Badge>
              <Badge variant={testCaseTypeBadgeVariants[tc.type]}>{tc.type}</Badge>
              {tc.category && (
                <Badge variant="outline" className={cn(
                  tc.category === "Positive" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {tc.category}
                </Badge>
              )}
              {tc.environment && <Badge variant="outline">{tc.environment}</Badge>}
              {tc.automationStatus && <Badge variant="outline">{tc.automationStatus}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.replace(`/test-cases/${id}/edit`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={handleClone} disabled={cloning}>
            <Copy className="h-3.5 w-3.5" /> {cloning ? "Cloning..." : "Clone"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:text-error hover:bg-error/5"
            aria-label="Delete test case"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" onClick={() => setIsRunnerOpen(true)} disabled={!tc}>
            <Play className="h-3.5 w-3.5" /> Run Test
          </Button>
        </div>
      </div>

      <div className="flex border-b-2 border-outline-variant/30">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-3 text-body-md font-medium transition-all relative",
              activeTab === tab ? "text-primary-container font-semibold" : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === "Details" && (
        <div className="space-y-6 animate-fade-in">
          {tc.description && (
            <div className="bg-white border border-outline-variant rounded-xl p-6">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Description</h3>
              <p className="text-body-md text-on-surface">{tc.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Module", value: tc.moduleName || tc.moduleId || "-" },
              { label: "Sub-Module", value: tc.subModuleName || "-" },
              { label: "Scenario", value: tc.scenarioName || "-" },
              { label: "Category", value: tc.category || "Positive" },
              { label: "Assigned To", value: tc.assignedTo || "-" },
              { label: "Requirement", value: tc.requirementId || "None" },
              { label: "Environment", value: tc.environment || "N/A" },
              { label: "Estimated Time", value: tc.estimatedTime || "N/A" },
              { label: "Automation Status", value: tc.automationStatus || "N/A" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-outline-variant rounded-xl p-4">
                <div className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-1">{item.label}</div>
                <div className="text-body-md text-on-surface font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between text-[11px] text-on-surface-variant/70 border-t border-outline-variant/30 pt-4 mt-4 px-1 gap-2">
            <div>
              Created by <span className="font-medium text-on-surface">{tc.createdBy}</span> on {formatDate(tc.createdAt)}
            </div>
            <div>
              Last modified on {formatDate(tc.updatedAt)}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Steps" && (
        <div className="space-y-4 animate-fade-in">
          {tc.preconditions && (
            <div className="bg-white border border-outline-variant rounded-xl p-6">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Preconditions</h3>
              <p className="text-body-md text-on-surface whitespace-pre-wrap">{tc.preconditions}</p>
            </div>
          )}

          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal w-16">#</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Action</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal w-40">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {tc.steps.map((step) => {
                  const hasDetails = !!(step.expectedResult || step.testData);
                  const isExpanded = !!expandedSteps[step.stepNumber];
                  return (
                    <tr key={step.stepNumber} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant mt-0.5">
                          {step.stepNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface align-top">
                        <div
                          className={cn(
                            "flex items-center gap-2 select-none",
                            hasDetails ? "cursor-pointer hover:text-primary transition-colors font-medium" : ""
                          )}
                          onClick={() => hasDetails && toggleStepExpand(step.stepNumber)}
                        >
                          {hasDetails && (
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 text-on-surface-variant transition-transform flex-shrink-0",
                                isExpanded ? "" : "-rotate-90"
                              )}
                            />
                          )}
                          <span>{step.action}</span>
                        </div>

                        {isExpanded && hasDetails && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                            {step.expectedResult && (
                              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-3 space-y-1">
                                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Expected Result</span>
                                <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap font-mono">
                                  {step.stepNumber}.1 {step.expectedResult}
                                </p>
                              </div>
                            )}
                            {step.testData && (
                              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-3 space-y-1">
                                <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Test Data</span>
                                <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{step.testData}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-1.5 mt-1">
                          {stepStatusIcon[step.status || "Not Run"]}
                          <span className="text-body-sm">{step.status || "Not Run"}</span>
                        </div>
                        {step.status === "Failed" && step.actualResult && (
                          <div className="text-body-sm text-error mt-1 italic pl-5.5">Actual: {step.actualResult}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {tc.expectedResult && (
            <div className="bg-white border border-outline-variant rounded-xl p-6">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Overall Expected Result</h3>
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 text-body-md text-on-surface whitespace-pre-wrap">
                {tc.expectedResult}
              </div>
            </div>
          )}

          {tc.notes && (
            <div className="bg-white border border-outline-variant rounded-xl p-6">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Notes</h3>
              <p className="text-body-md text-on-surface whitespace-pre-wrap">{tc.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Traceability" && (
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle animate-fade-in">
          <TCTraceabilityMatrix testCase={tc} />
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        testCaseId={id}
        isDeleting={deleting}
      />

      <ExecutionRunner
        isOpen={isRunnerOpen}
        onClose={() => setIsRunnerOpen(false)}
        testCases={tc ? [{
          id: tc.id,
          title: tc.title,
          description: tc.description || undefined,
          steps: tc.steps?.map(step => ({
            action: step.action,
            expectedResult: step.expectedResult || undefined,
          })),
        }] : []}
        onComplete={() => {
          setAlertState({
            isOpen: true,
            title: "Execution Completed",
            message: `Execution for test case ${tc?.id} completed successfully.`,
            type: "success",
          });
        }}
      />
    </div>
  );
}
