"use client";
import { useState, useEffect } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { Requirement, TestCase, Defect } from "@/lib/types";

interface TraceabilityMatrixProps {
  requirement: Requirement;
}

function statusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
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

export function TraceabilityMatrix({ requirement }: TraceabilityMatrixProps) {
  // Mock data for phase 2. In real implementation, these would be fetched from API based on the requirement ID.
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const tcResponse = await fetch(`/api/requirements/${requirement.id}/test-cases`);
        if (tcResponse.ok) {
          setTestCases(await tcResponse.json());
        }
        // Since there is no defects API yet in phase 2 prompt, keep defects mocked empty for now
        setDefects([]);
      } catch (error) {
        console.error("Failed to load traceability data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requirement.id]);

  if (loading) {
    return <div className="p-4 text-center text-outline">Loading matrix...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Traceability Matrix</h3>
        <Badge variant={testCases.length > 0 ? "success" : "in-review"}>
          {testCases.length > 0 ? "Coverage: OK" : "Missing Coverage"}
        </Badge>
      </div>

      <div className="overflow-x-auto border border-outline-variant rounded-xl bg-white shadow-subtle">
        <table className="w-full text-left text-body-sm">
          <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
            <tr>
              <th className="p-4 py-3 border-r border-outline-variant/50 w-1/3">Requirement</th>
              <th className="p-4 py-3 border-r border-outline-variant/50 w-1/3">Test Cases</th>
              <th className="p-4 py-3 w-1/3">Linked Defects</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            <tr className="hover:bg-surface-container-low transition-colors">
              <td className="p-4 border-r border-outline-variant/50 align-top">
                <div className="font-medium">{requirement.displayId}</div>
                <div className="text-on-surface-variant">{requirement.title}</div>
                <Badge variant={statusVariant(requirement.status)} className="mt-2">{requirement.status}</Badge>
              </td>
              <td className="p-4 border-r border-outline-variant/50 align-top">
                {testCases.length === 0 ? (
                  <span className="text-outline italic">No linked test cases</span>
                ) : (
                  <ul className="space-y-3">
                    {testCases.map(tc => (
                      <li key={tc.id} className="p-2 border border-outline-variant rounded bg-surface-container-low">
                        <div className="font-medium text-primary">{tc.id}</div>
                        <div className="text-xs text-on-surface-variant mb-1">{tc.title}</div>
                        <Badge variant={statusVariant(tc.status)}>{tc.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="p-4 align-top">
                {defects.length === 0 ? (
                  <span className="text-outline italic">No linked defects</span>
                ) : (
                  <ul className="space-y-3">
                    {defects.map(def => (
                      <li key={def.id} className="p-2 border border-outline-variant rounded bg-error/10">
                        <div className="font-medium text-error">{def.id}</div>
                        <div className="text-xs text-on-surface-variant mb-1">{def.title}</div>
                        <Badge variant={statusVariant(def.status)}>{def.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
