"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { Plus, PlayCircle } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { CreateRunModal } from "@/components/test-runs/create-run-modal";
import type { TestRun } from "@/lib/types";

function testRunStatusVariant(status: TestRun["status"]): BadgeVariant {
  if (status === "Not Started") return "not-run";
  if (status === "Planning") return "draft";
  if (status === "Running") return "in-progress";
  if (status === "Completed") return "passed";
  if (status === "Aborted") return "failed";
  return "outline";
}

export default function TestRunsPage() {
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTestRuns() {
      try {
        const response = await fetch("/api/test-runs", { cache: "no-store" });
        if (response.ok && isMounted) {
          setTestRuns(await response.json());
        }
      } catch (error) {
        console.error("Failed to load test runs", error);
      }
    }
    loadTestRuns();
    return () => { isMounted = false; };
  }, []);

  const handleCreateRun = async (data: any) => {
    const response = await fetch("/api/test-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const created = await response.json();
      setTestRuns((current) => [created, ...current]);
    }
  };

  const totalCount = testRuns.length;
  const runningCount = testRuns.filter((r) => r.status === "Running").length;
  const passedCount = testRuns.filter((r) => r.status === "Completed").length; // Mock, in reality this would be execution status pass rate
  const failedCount = testRuns.filter((r) => r.status === "Aborted").length;

  const statusTabs = [
    { label: "ALL", count: totalCount, value: "all" },
    { label: "PLANNING", count: testRuns.filter((r) => r.status === "Planning").length, value: "planning" },
    { label: "RUNNING", count: runningCount, value: "running" },
    { label: "COMPLETED", count: passedCount, value: "completed" },
    { label: "ABORTED", count: failedCount, value: "aborted" },
  ];

  const filteredRuns = useMemo(() => {
    return testRuns.filter((run) => {
      if (activeTab !== "all" && run.status.toLowerCase() !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          run.name.toLowerCase().includes(q) ||
          (run.displayId && run.displayId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [testRuns, activeTab, searchQuery]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Test Runs"
        subtitle="Execute tests and track results"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Test Run
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <KpiCard label="TOTAL" value={totalCount} />
        <KpiCard label="RUNNING" value={runningCount} valueColor="text-primary" />
        <KpiCard label="PASSED" value={passedCount} valueColor="text-success" hoverBorderColor="hover:border-success" />
        <KpiCard label="FAILED" value={failedCount} valueColor="text-error" hoverBorderColor="hover:border-error" />
        <KpiCard label="AVG" value={"85%"} />
      </div>

      <StatusTabs tabs={statusTabs} defaultValue="all" onChange={setActiveTab} />

      <SearchFilter
        placeholder="Search test runs by name or ID..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-subtle">
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center">
            <PlayCircle className="h-10 w-10 text-outline mx-auto mb-3 opacity-50" />
            <h3 className="text-body-lg font-semibold text-on-surface">No test runs found</h3>
          </div>
        ) : (
          <table className="w-full text-left text-body-sm">
            <thead className="bg-surface-container-low text-on-surface-variant font-medium border-b border-outline-variant">
              <tr>
                <th className="p-4 py-3">ID</th>
                <th className="p-4 py-3">Name</th>
                <th className="p-4 py-3">Type</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3">Environment</th>
                <th className="p-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filteredRuns.map((run) => (
                <tr key={run.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-4">
                    <Link href={`/test-runs/${run.id}`} className="font-medium text-primary hover:underline">
                      {run.displayId || run.id.substring(0,8)}
                    </Link>
                  </td>
                  <td className="p-4 font-medium text-on-surface">{run.name}</td>
                  <td className="p-4 text-on-surface-variant">
                    <Badge variant="outline">{run.type}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={testRunStatusVariant(run.status)}>{run.status}</Badge>
                  </td>
                  <td className="p-4 text-on-surface-variant">{run.environment}</td>
                  <td className="p-4 text-on-surface-variant text-xs">{timeAgo(run.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateRunModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRun}
      />
    </div>
  );
}
