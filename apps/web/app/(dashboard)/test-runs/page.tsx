"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { DataTable, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
  const router = useRouter();
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
  const passedCount = testRuns.filter((r) => r.status === "Completed").length;
  const failedCount = testRuns.filter((r) => r.status === "Aborted").length;

  const statusTabs = [
    { label: "All", count: totalCount, value: "all" },
    { label: "Planning", count: testRuns.filter((r) => r.status === "Planning").length, value: "planning" },
    { label: "Running", count: runningCount, value: "running" },
    { label: "Completed", count: passedCount, value: "completed" },
    { label: "Aborted", count: failedCount, value: "aborted" },
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
    <PageContainer>
      <PageHeader
        title="Test Runs"
        subtitle="Execute tests and track results"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" /> New Test Run
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Total" value={totalCount} />
        <KpiCard label="Running" value={runningCount} valueColor="text-primary" />
        <KpiCard label="Passed" value={passedCount} valueColor="text-success" hoverBorderColor="hover:border-success" />
        <KpiCard label="Failed" value={failedCount} valueColor="text-error" hoverBorderColor="hover:border-error" />
      </div>

      <StatusTabs tabs={statusTabs} defaultValue="all" onChange={setActiveTab} />

      <SearchFilter
        placeholder="Search test runs by name or ID..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {filteredRuns.length === 0 ? (
        <EmptyState icon={PlayCircle} title="No test runs found" />
      ) : (
        <DataTable>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Environment</TableHeaderCell>
              <TableHeaderCell>Created</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRuns.map((run) => (
              <TableRow
                key={run.id}
                clickable
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/test-runs/${run.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/test-runs/${run.id}`);
                  }
                }}
              >
                <TableCell className="font-mono text-code text-primary-container font-medium">
                  {run.displayId || run.id.substring(0,8)}
                </TableCell>
                <TableCell className="font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
                  {run.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{run.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={testRunStatusVariant(run.status)}>{run.status}</Badge>
                </TableCell>
                <TableCell className="text-on-surface-variant">{run.environment}</TableCell>
                <TableCell className="text-outline">{timeAgo(run.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}

      <CreateRunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateRun}
      />
    </PageContainer>
  );
}
