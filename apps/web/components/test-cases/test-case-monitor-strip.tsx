"use client";

import { Activity, AlertTriangle, GitBranch, ShieldCheck } from "lucide-react";
import type { TestCase } from "@/lib/types";

interface TestCaseMonitorSummary {
  total: number;
  approved: number;
  draft: number;
  ready: number;
  inReview: number;
  hasFailures: number;
}

interface TestCaseMonitorStripProps {
  summary: TestCaseMonitorSummary;
  items: TestCase[];
  total: number;
}

export function TestCaseMonitorStrip({ summary, items, total }: TestCaseMonitorStripProps) {
  const reviewQueue = summary.draft + summary.inReview;
  const runReady = summary.ready + summary.approved;
  const visibleModules = new Set(items.map((item) => item.moduleName || (item as any).module).filter(Boolean)).size;
  const loadedLabel = total > items.length ? `${items.length}/${total}` : String(total);

  const signals = [
    {
      label: "Workflow Queue",
      value: reviewQueue,
      detail: reviewQueue === 0 ? "No draft or review backlog" : "Draft and in-review cases",
      icon: Activity,
      tone: reviewQueue === 0 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-amber-700 bg-amber-50 border-amber-100",
    },
    {
      label: "Run Ready",
      value: runReady,
      detail: "Ready or approved cases",
      icon: ShieldCheck,
      tone: runReady > 0 ? "text-blue-700 bg-blue-50 border-blue-100" : "text-slate-600 bg-slate-50 border-slate-200",
    },
    {
      label: "Failure Signal",
      value: summary.hasFailures,
      detail: summary.hasFailures === 0 ? "No failed-step signals" : "Cases with failed steps",
      icon: AlertTriangle,
      tone: summary.hasFailures === 0 ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-red-700 bg-red-50 border-red-100",
    },
    {
      label: "Visible Structure",
      value: visibleModules,
      detail: `${loadedLabel} cases loaded across modules`,
      icon: GitBranch,
      tone: "text-indigo-700 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <section className="border border-outline-variant rounded-xl bg-white shadow-subtle overflow-hidden">
      <div className="px-5 py-3 border-b border-outline-variant/60 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-label-bold font-label-bold text-on-surface uppercase tracking-normal">
            Library Monitor
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Operational signals for review, execution, failure, and module coverage.
          </p>
        </div>
        <div className="text-body-sm text-outline font-medium">
          {summary.total} total cases
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/60">
        {signals.map((signal) => (
          <div key={signal.label} className="p-5 flex items-center gap-4 min-w-0">
            <div className={`h-10 w-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${signal.tone}`}>
              <signal.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-normal text-outline">
                {signal.label}
              </div>
              <div className="text-headline-sm font-headline font-semibold text-on-surface leading-tight">
                {signal.value}
              </div>
              <div className="text-body-sm text-on-surface-variant truncate">
                {signal.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
