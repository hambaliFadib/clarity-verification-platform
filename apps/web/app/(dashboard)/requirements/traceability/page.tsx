"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TraceabilityItem {
  requirement_id: string;
  requirement_display_id: string;
  requirement_title: string;
  requirement_status: string;
  test_cases: {
    id: string;
    display_id: string;
    title: string;
    status: string;
  }[];
}

function statusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  if (normalized === "in-review") return "in-review";
  if (normalized === "approved") return "approved";
  if (normalized === "ready") return "ready";
  if (normalized === "draft") return "draft";
  return "outline";
}

export default function FullTraceabilityPage() {
  const [matrix, setMatrix] = useState<TraceabilityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMatrix() {
      try {
        const response = await fetch("/api/requirements/traceability");
        if (response.ok) {
          setMatrix(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch traceability matrix", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatrix();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer w-fit mb-2">
        <Link href="/requirements" className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Requirements
        </Link>
      </div>

      <PageHeader
        title="Traceability Matrix"
        subtitle="End-to-end mapping of requirements to test cases and defects"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export Matrix
          </Button>
        }
      />

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm min-w-[800px]">
            <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
              <tr>
                <th className="p-4 py-3 border-r border-outline-variant/50 w-1/3">Requirement</th>
                <th className="p-4 py-3 border-r border-outline-variant/50 w-1/3">Linked Test Cases</th>
                <th className="p-4 py-3 w-1/3">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-outline animate-pulse">
                    Loading traceability data...
                  </td>
                </tr>
              ) : matrix.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-outline">
                    No requirements found in the matrix.
                  </td>
                </tr>
              ) : (
                matrix.map((item) => (
                  <tr key={item.requirement_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4 border-r border-outline-variant/50 align-top">
                      <div className="font-medium text-primary mb-1">
                        <Link href={`/requirements/${item.requirement_id}`} className="hover:underline">
                          {item.requirement_display_id}
                        </Link>
                      </div>
                      <div className="text-on-surface-variant mb-2">{item.requirement_title}</div>
                      <Badge variant={statusVariant(item.requirement_status)}>
                        {item.requirement_status}
                      </Badge>
                    </td>
                    <td className="p-4 border-r border-outline-variant/50 align-top">
                      {item.test_cases.length === 0 ? (
                        <span className="text-outline italic">No linked test cases</span>
                      ) : (
                        <ul className="space-y-3">
                          {item.test_cases.map((tc) => (
                            <li key={tc.id} className="p-3 border border-outline-variant rounded-lg bg-surface-container-highest/20">
                              <div className="font-medium text-primary mb-1">{tc.display_id}</div>
                              <div className="text-xs text-on-surface-variant mb-2">{tc.title}</div>
                              <Badge variant={statusVariant(tc.status)} className="text-[10px]">
                                {tc.status}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        {item.test_cases.length > 0 ? (
                          <Badge variant="success">Covered</Badge>
                        ) : (
                          <Badge variant="failed">Missing Coverage</Badge>
                        )}
                        <span className="text-xs text-outline">
                          {item.test_cases.length} test cases
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
