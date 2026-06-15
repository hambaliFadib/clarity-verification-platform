"use client";
import { useState, useEffect } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, Link2, Bug, FileText } from "lucide-react";
import type { TestCase } from "@/lib/types";

interface TCTraceabilityMatrixProps {
  testCase: TestCase;
}

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
  if (["approved", "ready", "resolved", "closed", "baseline"].includes(normalized)) {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }
  if (["open", "blocked", "failed", "critical"].includes(normalized)) {
    return <AlertCircle className="h-4 w-4 text-error" />;
  }
  return <Clock className="h-4 w-4 text-on-surface-variant" />;
}

export function TCTraceabilityMatrix({ testCase }: TCTraceabilityMatrixProps) {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/test-cases/${testCase.displayId}/traceability`);
        if (response.ok) {
          const data = await response.json();
          setRequirements(data.requirements || []);
          setDefects(data.defects || []);
        }
      } catch (error) {
        console.error("Failed to load traceability data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testCase.displayId]);

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Connection lines background */}
        <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-outline-variant/30 -z-10 -translate-y-1/2" />

        {/* Column 1: Linked Requirements */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            <FileText className="h-4 w-4" /> Requirements ({requirements.length})
          </h4>
          {requirements.length === 0 ? (
            <div className="h-full min-h-[100px] border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant text-sm bg-surface-container-low/50">
              No linked requirements
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {requirements.map(req => (
                <div key={req.id} className="bg-white border border-outline-variant hover:border-primary/40 transition-all rounded-xl p-4 shadow-sm group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-on-surface-variant group-hover:text-primary transition-colors">
                      {req.displayId || req.id?.substring(0,8)}
                    </span>
                    <StatusIcon status={req.status} />
                  </div>
                  <h5 className="text-sm font-medium text-on-surface line-clamp-2 mb-3">{req.title}</h5>
                  <Badge variant={statusVariant(req.status)} className="text-[10px]">{req.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: This Test Case */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">Test Case</h4>
          <div className="bg-primary/5 border-2 border-primary/30 hover:border-primary/60 transition-colors rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                {testCase.displayId}
              </span>
              <StatusIcon status={testCase.status} />
            </div>
            <h5 className="font-medium text-on-surface line-clamp-2 mb-3">{testCase.title}</h5>
            <div className="flex gap-2">
              <Badge variant={statusVariant(testCase.status)}>{testCase.status}</Badge>
            </div>
          </div>
        </div>

        {/* Column 3: Linked Defects */}
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-on-surface-variant uppercase tracking-wider mb-4">
            <Bug className="h-4 w-4" /> Defects ({defects.length})
          </h4>
          {defects.length === 0 ? (
            <div className="h-full min-h-[100px] border-2 border-dashed border-outline-variant rounded-xl flex items-center justify-center text-on-surface-variant text-sm bg-surface-container-low/50">
              No defects found
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {defects.map(def => (
                <div key={def.id} className="bg-error/5 border border-error/20 hover:border-error/40 transition-all rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-error">
                      {def.displayId || def.id?.substring(0,8)}
                    </span>
                    <StatusIcon status={def.status} />
                  </div>
                  <h5 className="text-sm font-medium text-on-surface line-clamp-2 mb-3">{def.title}</h5>
                  <div className="flex gap-2">
                    <Badge variant={statusVariant(def.status)} className="text-[10px]">{def.status}</Badge>
                    <Badge variant="outline" className="text-[10px] bg-white">{def.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
