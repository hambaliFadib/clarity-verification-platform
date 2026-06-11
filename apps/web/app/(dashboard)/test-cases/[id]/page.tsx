"use client";

import { use, useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  getDefectStatusBadgeVariant,
  priorityBadgeVariants,
  severityBadgeVariants,
  testCaseStatusBadgeVariants,
  testCaseTypeBadgeVariants,
} from "@/lib/badge-variants";
import type { Defect, TestCase } from "@/lib/types";

const tabs = ["Details", "Steps", "Defects"];

const stepStatusIcon: Record<string, ReactNode> = {
  Passed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  Failed: <XCircle className="h-4 w-4 text-red-600" />,
  Blocked: <MinusCircle className="h-4 w-4 text-amber-600" />,
  "Not Run": <Clock className="h-4 w-4 text-slate-400" />,
  Skipped: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
};

export default function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("Details");
  const [tc, setTc] = useState<TestCase | null>(null);
  const [linkedDefects, setLinkedDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="p-6 space-y-6 animate-fade-in">
      <Link
        href="/test-cases"
        className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Test Cases
      </Link>

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <span className="font-mono text-code text-primary-container">{tc.id}</span>
          <h1 className="text-headline-md font-headline font-semibold text-on-surface">{tc.title}</h1>
          <div className="flex gap-2">
            <Badge variant={testCaseStatusBadgeVariants[tc.status]}>{tc.status}</Badge>
            <Badge variant={priorityBadgeVariants[tc.priority]}>{tc.priority}</Badge>
            <Badge variant={testCaseTypeBadgeVariants[tc.type]}>{tc.type}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="secondary" size="sm">
            <Copy className="h-3.5 w-3.5" /> Clone
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:text-error hover:bg-error/5"
            aria-label="Delete test case"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm">
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
              { label: "Module", value: tc.module },
              { label: "Assigned To", value: tc.assignedTo || "-" },
              { label: "Created By", value: tc.createdBy },
              { label: "Created", value: formatDate(tc.createdAt) },
              { label: "Last Modified", value: formatDate(tc.updatedAt) },
              { label: "Estimated Time", value: tc.estimatedTime || "N/A" },
              { label: "Requirement", value: tc.requirementId || "None" },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-outline-variant rounded-xl p-4">
                <div className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-1">{item.label}</div>
                <div className="text-body-md text-on-surface font-medium">{item.value}</div>
              </div>
            ))}
          </div>
          {tc.tags && tc.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <span className="text-label-bold text-outline">Tags:</span>
              {tc.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "Steps" && (
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden animate-fade-in">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal w-16">#</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Action</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Expected Result</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {tc.steps.map((step) => (
                <tr key={step.stepNumber} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant">
                      {step.stepNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface">{step.action}</td>
                  <td className="px-4 py-3">
                    <div className="text-body-sm text-on-surface">{step.expectedResult}</div>
                    {step.status === "Failed" && step.actualResult && (
                      <div className="text-body-sm text-error mt-1 italic">Actual: {step.actualResult}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {stepStatusIcon[step.status || "Not Run"]}
                      <span className="text-body-sm">{step.status || "Not Run"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "Defects" && (
        <div className="space-y-3 animate-fade-in">
          {linkedDefects.length === 0 ? (
            <div className="bg-white border border-outline-variant rounded-xl p-8 text-center">
              <p className="text-body-md text-on-surface-variant">No defects linked to this test case.</p>
            </div>
          ) : (
            linkedDefects.map((d) => (
              <Link
                key={d.id}
                href={`/defects/${d.id}`}
                className="block bg-white border border-outline-variant rounded-xl p-4 hover:shadow-card hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Badge variant={severityBadgeVariants[d.severity]}>{d.severity}</Badge>
                      <Badge variant={getDefectStatusBadgeVariant(d.status)}>{d.status}</Badge>
                    </div>
                    <h4 className="text-body-md font-medium text-on-surface">{d.title}</h4>
                    <p className="text-body-sm text-on-surface-variant">Reported by {d.reportedBy}</p>
                  </div>
                  <span className="text-[11px] text-outline">{formatDate(d.createdAt)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
