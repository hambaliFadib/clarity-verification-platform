"use client";
import { useState, useEffect } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Link2, Bug, ChevronDown } from "lucide-react";
import type { Requirement, Defect } from "@/lib/types";

interface TraceabilityMatrixProps {
  requirement: Requirement;
  linkedTestCasesOverride?: TraceabilityTestCase[];
}

type TraceabilityTestCase = {
  id: string;
  realId?: string;
  displayId?: string;
  title: string;
  module?: string;
  severity?: string;
  status: string;
  type?: string;
};

type TraceabilityDefect = Defect & {
  displayId?: string;
};

function statusVariant(status: string): BadgeVariant {
  const normalized = status?.toLowerCase().replace(/\s+/g, "-") || "outline";
  if (normalized === "in-review") return "in-review";
  if (normalized === "approved") return "approved";
  if (normalized === "ready") return "ready";
  if (normalized === "draft") return "draft";
  if (normalized === "open") return "open";
  if (normalized === "blocked") return "blocked";
  if (normalized === "resolved") return "resolved";
  if (normalized === "closed") return "closed";
  return "outline";
}

function StatusIcon({ status }: { status: string }) {
  const normalized = status?.toLowerCase().replace(/\s+/g, "-") || "";
  if (["approved", "ready", "resolved", "closed"].includes(normalized)) {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (["open", "blocked", "failed", "critical"].includes(normalized)) {
    return <AlertCircle className="h-4 w-4 text-error" />;
  }
  return <Clock className="h-4 w-4 text-on-surface-variant" />;
}

export function TraceabilityMatrix({ requirement, linkedTestCasesOverride }: TraceabilityMatrixProps) {
  const [testCases, setTestCases] = useState<TraceabilityTestCase[]>(linkedTestCasesOverride || []);
  const [defects, setDefects] = useState<TraceabilityDefect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/requirements/${requirement.id}/traceability`);
        if (response.ok) {
          const data = await response.json();
          setTestCases(linkedTestCasesOverride || data.test_cases || []);
          setDefects(data.defects || []);
        } else if (linkedTestCasesOverride) {
          setTestCases(linkedTestCasesOverride);
        }
      } catch (error) {
        console.error("Failed to load traceability data", error);
        if (linkedTestCasesOverride) {
          setTestCases(linkedTestCasesOverride);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requirement.id, linkedTestCasesOverride]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold text-on-surface">End-to-End Traceability</h3>
        </div>
        <Badge variant={testCases.length > 0 ? "success" : "in-review"} className="px-3 py-1 text-xs">
          {testCases.length > 0 ? "Coverage: Validated" : "Missing Coverage"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connection lines background (visible only on md+) */}
        <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-outline-variant/30 -z-10 -translate-y-1/2" />

        {/* Column 1: Requirement */}
        <div className="flex flex-col h-full">
          <h4 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">Source</h4>
          <div className="bg-white border border-outline-variant hover:border-primary/50 transition-colors rounded-xl p-5 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                {requirement.displayId}
              </span>
              <StatusIcon status={requirement.status} />
            </div>
            <h5 className="font-medium text-on-surface line-clamp-2 mb-3">{requirement.title}</h5>
            <div className="flex gap-2">
              <Badge variant={statusVariant(requirement.status)}>{requirement.status}</Badge>
            </div>
          </div>
        </div>

        {/* Column 2: Test Cases */}
        <div className="flex flex-col h-full">
          <h4 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            Test Cases ({testCases.length})
          </h4>
          {testCases.length === 0 ? (
            <div className="flex-1 min-h-[100px] border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant text-sm bg-surface-container-low/50">
              No linked test cases
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <StackedTestCases testCases={testCases} />
            </div>
          )}
        </div>

        {/* Column 3: Defects */}
        <div className="flex flex-col h-full">
          <h4 className="flex items-center gap-2 text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            <Bug className="h-4 w-4" /> Defects ({defects.length})
          </h4>
          {defects.length === 0 ? (
            <div className="flex-1 min-h-[100px] border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant text-sm bg-surface-container-low/50">
              No defects found
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <StackedDefects defects={defects} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StackedTestCases({ testCases }: { testCases: TraceabilityTestCase[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(testCases[0]?.id || null);

  if (testCases.length === 1) {
    const tc = testCases[0];
    return (
      <div className="bg-white border border-outline-variant hover:border-primary/40 transition-all rounded-xl p-5 shadow-sm group flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
            {tc.displayId || tc.id?.substring(0,8)}
          </span>
          <StatusIcon status={tc.status} />
        </div>
        <h5 className="font-medium text-on-surface line-clamp-2 mb-4">{tc.title}</h5>
        <Badge variant={statusVariant(tc.status)} className="text-[10px]">{tc.status}</Badge>
      </div>
    );
  }

  return (
    <>
      {testCases.map((tc) => {
        const isExpanded = expandedId === tc.id;
        return (
          <div
            key={tc.id}
            onClick={() => setExpandedId(isExpanded ? null : tc.id)}
            className={`bg-white border transition-all rounded-xl shadow-sm cursor-pointer overflow-hidden ${
              isExpanded ? "border-primary/40 p-4" : "border-outline-variant hover:border-primary/40 p-3"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold transition-colors ${isExpanded ? "text-primary" : "text-on-surface-variant"}`}>
                {tc.displayId || tc.id?.substring(0,8)}
              </span>
              <div className="flex items-center gap-2">
                <StatusIcon status={tc.status} />
                <ChevronDown className={`h-4 w-4 text-outline transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>
            
            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
              <div className="overflow-hidden">
                <h5 className="text-sm font-medium text-on-surface line-clamp-2 mb-3">{tc.title}</h5>
                <Badge variant={statusVariant(tc.status)} className="text-[10px]">{tc.status}</Badge>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function StackedDefects({ defects }: { defects: TraceabilityDefect[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(defects[0]?.id || null);

  if (defects.length === 1) {
    const def = defects[0];
    return (
      <div className="bg-error/5 border border-error/20 hover:border-error/40 transition-all rounded-xl p-5 shadow-sm flex-1">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-error">
            {def.displayId || def.id?.substring(0,8)}
          </span>
          <StatusIcon status={def.status} />
        </div>
        <h5 className="font-medium text-on-surface line-clamp-2 mb-4">{def.title}</h5>
        <div className="flex gap-2">
          <Badge variant={statusVariant(def.status)} className="text-[10px]">{def.status}</Badge>
          <Badge variant="outline" className="text-[10px] bg-white">{def.severity}</Badge>
        </div>
      </div>
    );
  }

  return (
    <>
      {defects.map((def) => {
        const isExpanded = expandedId === def.id;
        return (
          <div
            key={def.id}
            onClick={() => setExpandedId(isExpanded ? null : def.id)}
            className={`bg-error/5 border transition-all rounded-xl shadow-sm cursor-pointer overflow-hidden ${
              isExpanded ? "border-error/40 p-4" : "border-error/20 hover:border-error/40 p-3"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold transition-colors ${isExpanded ? "text-error" : "text-error/70"}`}>
                {def.displayId || def.id?.substring(0,8)}
              </span>
              <div className="flex items-center gap-2">
                <StatusIcon status={def.status} />
                <ChevronDown className={`h-4 w-4 text-error/50 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </div>
            
            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
              <div className="overflow-hidden">
                <h5 className="text-sm font-medium text-on-surface line-clamp-2 mb-3">{def.title}</h5>
                <div className="flex gap-2">
                  <Badge variant={statusVariant(def.status)} className="text-[10px]">{def.status}</Badge>
                  <Badge variant="outline" className="text-[10px] bg-white/50">{def.severity}</Badge>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

