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
} from "lucide-react";
import { ExecutionRunner } from "@/components/test-runs/execution-runner";
import { EvidenceViewer } from "@/components/test-runs/evidence-viewer";
import { RunTimeline } from "@/components/test-runs/run-timeline";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { TestRun } from "@/lib/types";

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

  if (!testRun) {
    return <PageSkeleton />;
  }

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
          <div className="flex items-center gap-2">
            <Badge variant="outline">{testRun.type}</Badge>
            <Badge variant={testRunStatusVariant(testRun.status)}>{testRun.status}</Badge>
            <Badge variant="success">95% Pass Rate</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" onClick={handleStart} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <Play className="h-4 w-4 mr-2" /> Start
          </Button>
          <Button variant="outline" className="text-error hover:bg-error/10 border-error/20" onClick={handleAbort} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <XSquare className="h-4 w-4 mr-2" /> Abort
          </Button>
          <Button variant="outline" onClick={handleComplete} disabled={testRun.status === "Completed" || testRun.status === "Aborted"}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" /> View Report
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export
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
              <span className="font-medium text-success">95%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold border-b border-outline-variant pb-2 mb-4">Test Cases</h3>
          <ul className="space-y-2 text-body-sm">
            <li className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-container-low">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-medium">TC-001 Login valid</span>
              </div>
              <span className="text-outline">1.2s</span>
            </li>
            <li className="flex justify-between items-center p-3 border border-outline-variant rounded bg-error/10">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-error" />
                <span className="font-medium">TC-003 Login expired</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-outline">1.5s</span>
                <Link href="/defects/DEF-002" className="text-error hover:underline flex items-center gap-1">
                  <ArrowRight className="h-3.5 w-3.5" /> DEF-002
                </Link>
              </div>
            </li>
            <li className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-container-low opacity-60">
              <div className="flex items-center gap-2">
                <SkipForward className="h-4 w-4 text-outline" />
                <span className="font-medium text-outline">TC-004 Login 2FA</span>
              </div>
              <Badge variant="outline">SKIPPED</Badge>
            </li>
          </ul>
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
        testCases={[{ id: "TC-001", title: "Login valid", steps: [{ action: "Enter credentials", expectedResult: "Dashboard loads" }] }]}
        onComplete={() => console.log("Run completed")}
      />
    </div>
  );
}
