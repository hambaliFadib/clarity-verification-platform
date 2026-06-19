"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  Play,
  SkipForward,
  XCircle,
  XSquare,
  Filter,
  FolderGit2,
  Bug,
} from "lucide-react";
import { ExecutionRunner } from "@/components/test-runs/execution-runner";
import { EvidenceViewer } from "@/components/test-runs/evidence-viewer";
import { RunTimeline } from "@/components/test-runs/run-timeline";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { TestRun, TestCase } from "@/lib/types";

function testRunStatusVariant(status: TestRun["status"]): BadgeVariant {
  if (status === "Not Started") return "not-run";
  if (status === "Planning") return "draft";
  if (status === "Running") return "in-progress";
  if (status === "Completed") return "passed";
  if (status === "Aborted") return "failed";
  return "outline";
}

export default function TestRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);

  useEffect(() => {
    async function loadRun() {
      try {
        const response = await fetch(`/api/test-runs/${id}`, { cache: "no-store" });
        if (response.ok) {
          setTestRun(await response.json());
        }
      } catch (error) {
        console.error("Failed to load test run", error);
      }
    }
    loadRun();
  }, [id]);

  useEffect(() => {
    async function loadTestCases() {
      try {
        const response = await fetch("/api/test-cases?limit=1000", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setTestCases(data.items || []);
        }
      } catch (error) {
        console.error("Failed to load test cases", error);
      }
    }
    loadTestCases();
  }, []);

  const handleStart = async () => {
    const res = await fetch(`/api/test-runs/${id}/start`, { method: "POST" });
    if (res.ok) setTestRun(await res.json());
    setIsRunnerOpen(true);
  };

  const handleAbort = async () => {
    const res = await fetch(`/api/test-runs/${id}/abort`, { method: "POST" });
    if (res.ok) setTestRun(await res.json());
  };

  const handleComplete = async () => {
    const res = await fetch(`/api/test-runs/${id}/complete`, { method: "POST" });
    if (res.ok) setTestRun(await res.json());
  };

  const handleTestCaseResult = async (tcId: string, status: "Passed" | "Failed" | "Skipped") => {
    const targetCase = testCases.find(tc => tc.id === tcId);
    if (!targetCase) return;

    const stepStatus: "Passed" | "Failed" | "Blocked" | "Not Run" | "Skipped" | undefined = status === "Passed" ? "Passed" : status === "Failed" ? "Failed" : "Skipped";
    const updatedSteps = targetCase.steps.map(step => ({
      ...step,
      status: stepStatus
    }));

    const tcRes = await fetch(`/api/test-cases/${targetCase.id || tcId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testSteps: updatedSteps })
    });

    let newCases = [...testCases];
    if (tcRes.ok) {
      const updatedTc = await tcRes.json();
      newCases = testCases.map(tc => tc.id === tcId ? updatedTc : tc);
      setTestCases(newCases);
    } else {
      newCases = testCases.map(tc => tc.id === tcId ? { ...tc, steps: updatedSteps } : tc);
      setTestCases(newCases);
    }

    let passedCount = 0;
    let failedCount = 0;
    let notRunCount = 0;

    newCases.forEach(tc => {
      const hasFailed = tc.steps.some(s => s.status === "Failed");
      const allPassed = tc.steps.length > 0 && tc.steps.every(s => s.status === "Passed");
      if (hasFailed) failedCount++;
      else if (allPassed) passedCount++;
      else notRunCount++;
    });

    const runRes = await fetch(`/api/test-runs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passed: passedCount,
        failed: failedCount,
        blocked: 0,
        notRun: notRunCount,
        totalCases: newCases.length
      })
    });

    if (runRes.ok) {
      const updatedRun = await runRes.json();
      setTestRun(updatedRun);
    } else {
      setTestRun(prev => prev ? {
        ...prev,
        passed: passedCount,
        failed: failedCount,
        notRun: notRunCount,
        totalCases: newCases.length
      } : null);
    }
  };

  const getCaseStatusIcon = (tc: TestCase) => {
    const hasFailed = tc.steps.some(s => s.status === "Failed");
    const allPassed = tc.steps.length > 0 && tc.steps.every(s => s.status === "Passed");
    if (hasFailed) return <XCircle className="h-4 w-4 text-error" />;
    if (allPassed) return <CheckCircle2 className="h-4 w-4 text-success" />;
    return <SkipForward className="h-4 w-4 text-outline" />;
  };

  const getCaseBgClass = (tc: TestCase) => {
    const hasFailed = tc.steps.some(s => s.status === "Failed");
    const allPassed = tc.steps.length > 0 && tc.steps.every(s => s.status === "Passed");
    if (hasFailed) return "bg-error/5 hover:bg-error/10 border-error/20";
    if (allPassed) return "bg-surface-container-low hover:bg-surface-container";
    return "bg-surface-container-lowest opacity-70";
  };

  const modulesGroup = testCases.reduce<Record<string, TestCase[]>>((acc, tc) => {
    const key = tc.moduleName || "General";
    if (!acc[key]) acc[key] = [];
    acc[key].push(tc);
    return acc;
  }, {});

  if (!testRun) {
    return <PageSkeleton />;
  }

  const totalCases = testRun.totalCases || 0;
  const passRate = totalCases > 0 ? Math.round((testRun.passed / totalCases) * 100) : 0;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer w-fit mb-2">
        <Link href="/test-runs" className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Test Runs
        </Link>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:justify-between xl:items-start">
        <div className="space-y-2">
          <h1 className="text-display-sm font-semibold text-on-surface">
            {testRun.displayId || testRun.id}: {testRun.name}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="outline">{testRun.type}</Badge>
            <Badge variant={testRunStatusVariant(testRun.status)}>{testRun.status}</Badge>
            <Badge variant="success">{passRate}% Pass Rate</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 xl:mt-0">
          <Button variant="default" className="shadow-none" onClick={handleStart} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <Play className="h-4 w-4" /> Start
          </Button>
          <Button variant="outline" className="text-error border-error/30 hover:bg-error/5 shadow-none" onClick={handleAbort} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <XSquare className="h-4 w-4" /> Abort
          </Button>
          <Button variant="outline" className="text-primary border-outline-variant hover:bg-surface-container-low shadow-none" onClick={handleComplete} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <CheckCircle2 className="h-4 w-4" /> Complete
          </Button>
          <Button variant="outline" className="text-primary border-outline-variant hover:bg-surface-container-low shadow-none">
            <FileText className="h-4 w-4" /> View Report
          </Button>
          <Button variant="outline" className="text-primary border-outline-variant hover:bg-surface-container-low shadow-none">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold border-b border-outline-variant pb-2 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-body-sm">
            <div>
              <span className="block text-outline mb-1">Environment</span>
              <span className="font-medium">{testRun.environment}</span>
            </div>
            <div>
              <span className="block text-outline mb-1">Release</span>
              <span className="font-medium">{testRun.release || "None"}</span>
            </div>
            <div>
              <span className="block text-outline mb-1">Duration</span>
              <span className="font-medium">2m 30s</span>
            </div>
            <div>
              <span className="block text-outline mb-1">Pass Rate</span>
              <span className="font-medium text-success">{passRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-4 mb-4 gap-4">
            <h3 className="text-body-lg font-semibold">Test Cases</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 shadow-none">
                <Filter className="h-3.5 w-3.5 mr-1" /> Module: All
              </Button>
              <Button variant="outline" size="sm" className="h-8 shadow-none">
                <Filter className="h-3.5 w-3.5 mr-1" /> Scenario: All
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {Object.keys(modulesGroup).length === 0 ? (
              <div className="text-center py-6 text-outline border border-outline-variant rounded-xl border-dashed">
                No test cases defined in the project.
              </div>
            ) : (
              Object.entries(modulesGroup).map(([moduleName, cases]) => {
                const total = cases.length;
                const passed = cases.filter(tc => tc.steps.length > 0 && tc.steps.every(s => s.status === "Passed")).length;
                const progress = total > 0 ? Math.round((passed / total) * 100) : 0;
                
                return (
                  <div key={moduleName}>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <FolderGit2 className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-on-surface">{moduleName}</h4>
                      <Badge variant="outline" className="ml-2 bg-surface-container-low text-xs">
                        Progress: {progress}%
                      </Badge>
                    </div>

                    <ul className="space-y-2 text-body-sm pl-4 border-l-2 border-outline-variant/30 ml-4">
                      {cases.map((tc) => (
                        <li 
                          key={tc.id} 
                          className={`flex justify-between items-center p-3 border border-outline-variant rounded-lg transition-colors ${getCaseBgClass(tc)}`}
                        >
                          <div className="flex items-center gap-3">
                            {getCaseStatusIcon(tc)}
                            <div>
                              <span className="font-medium text-on-surface block">
                                {tc.id}: {tc.title}
                              </span>
                              {tc.scenarioName && (
                                <span className="text-xs text-muted-foreground">Scenario: {tc.scenarioName}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-outline text-xs bg-white px-2 py-1 border border-outline-variant rounded">
                            {tc.estimatedTime || "5m"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <EvidenceViewer runId={id as string} />
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold border-b border-outline-variant pb-2 mb-4">Timeline</h3>
          <RunTimeline />
        </div>
      </div>

      <ExecutionRunner
        isOpen={isRunnerOpen}
        onClose={() => setIsRunnerOpen(false)}
        testCases={testCases}
        onTestCaseResult={handleTestCaseResult}
        onComplete={handleComplete}
      />
    </div>
  );
}
