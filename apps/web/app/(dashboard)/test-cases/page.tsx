"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { DataTable, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, FlaskConical, CheckCircle2, XCircle, Clock, Upload, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  testCaseSeverityBadgeVariants,
  testCaseStatusBadgeVariants,
  testCaseTypeBadgeVariants,
} from "@/lib/badge-variants";
import type { TestCase } from "@/lib/types";
import {
  AdvancedFilterModal,
  type TestCaseAdvancedFilters,
} from "@/components/test-cases/advanced-filter-modal";
import { ImportReviewModal } from "@/components/test-cases/import-review-modal";
import { ImportExportModal } from "@/components/test-cases/import-export-modal";
import { AlertModal } from "@/components/ui/alert-modal";
import { useInfiniteTestCases } from "@/hooks/use-infinite-test-cases";
import { TestCasesTabs } from "@/components/test-cases/test-cases-tabs";

function TestCasesLoading() {
  return (
    <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      <div className="text-body-sm text-muted-foreground">Loading test cases...</div>
    </div>
  );
}

interface TestCaseSummary {
  total: number;
  approved: number;
  draft: number;
  ready: number;
  inReview: number;
  hasFailures: number;
}

function TestCasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });
  const [isParseResultOpen, setIsParseResultOpen] = useState(false);
  const [parseResult, setParseResult] = useState<any>(null);

  // KPI summary from dedicated endpoint
  const [summary, setSummary] = useState<TestCaseSummary>({
    total: 0,
    approved: 0,
    draft: 0,
    ready: 0,
    inReview: 0,
    hasFailures: 0,
  });

  // Advanced filters
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<TestCaseAdvancedFilters>({
    module: "",
    type: "",
    severity: "",
    tags: "",
  });

  // Infinite scroll hook
  const {
    items,
    total,
    isLoading,
    isLoadingMore,
    hasMore,
    refresh,
    sentinelRef,
  } = useInfiniteTestCases({
    search,
    status: activeStatus,
    module: advancedFilters.module || undefined,
    type: advancedFilters.type || undefined,
    severity: advancedFilters.severity || undefined,
    tags: advancedFilters.tags || undefined,
  });

  // Fetch KPI summary
  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch("/api/test-cases/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Failed to load summary:", err);
      }
    }
    loadSummary();
  }, []);

  // Refresh summary after import or delete
  const refreshSummary = async () => {
    try {
      const res = await fetch("/api/test-cases/summary");
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (err) {
      console.error("Failed to refresh summary:", err);
    }
  };

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType === "deleted") {
      setAlertState({
        isOpen: true,
        title: "Test Case Deleted",
        message: "The test case was deleted successfully.",
        type: "success",
      });
      refreshSummary();
      refresh();
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleImportComplete(result: { created: number; skipped: number; overwritten: number; errors: any[] }) {
    setIsParseResultOpen(false);
    setParseResult(null);
    const parts = [
      result.created > 0 && `${result.created} created`,
      result.overwritten > 0 && `${result.overwritten} overwritten`,
      result.skipped > 0 && `${result.skipped} skipped`,
    ].filter(Boolean);
    const isError = result.errors.length > 0;
    setAlertState({
      isOpen: true,
      title: isError ? "Import Completed with Errors" : "Import Successful",
      message: isError
        ? `Import completed with errors: ${result.errors.length} row(s) failed.`
        : `Import successful — ${parts.join(", ")}.`,
      type: isError ? "warning" : "success"
    });
    refresh();
    refreshSummary();
  }

  const statusTabs = [
    { label: "All", count: summary.total, value: "all" },
    { label: "Draft", count: summary.draft, value: "draft" },
    { label: "Ready", count: summary.ready, value: "ready" },
    { label: "In Review", count: summary.inReview, value: "in-review" },
    { label: "Approved", count: summary.approved, value: "approved" },
  ];

  return (
    <>
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
      />
      <PageContainer>
        <PageHeader
          title="Test Cases"
          subtitle="Manage and organize your test case library"
          actions={
            <div className="flex items-center gap-2">
              <Button
                id="import-export-trigger-btn"
                variant="outline"
                onClick={() => setIsImportExportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Import / Export
              </Button>
              <Link href="/test-cases/create">
                <Button id="create-test-case-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  New Test Cases
                </Button>
              </Link>
            </div>
          }
        />

        <TestCasesTabs />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <KpiCard label="Total" value={summary.total} icon={FlaskConical} />
          <KpiCard
            label="Approved"
            value={summary.approved}
            icon={CheckCircle2}
            valueColor="text-emerald-600"
            iconColor="text-emerald-600"
            hoverBorderColor="hover:border-emerald-500"
          />
          <KpiCard
            label="Has Failures"
            value={summary.hasFailures}
            icon={XCircle}
            valueColor="text-error"
            iconColor="text-error"
            hoverBorderColor="hover:border-error"
          />
          <KpiCard
            label="In Review / Draft"
            value={summary.inReview + summary.draft}
            icon={Clock}
            valueColor="text-amber-600"
            iconColor="text-amber-600"
            hoverBorderColor="hover:border-amber-400"
          />
        </div>

        <StatusTabs tabs={statusTabs} defaultValue={activeStatus} onChange={setActiveStatus} />
        <SearchFilter
          placeholder="Search test cases..."
          value={search}
          onChange={setSearch}
          onAddFilterClick={() => setIsAdvancedFilterOpen(true)}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-outline-variant/30 rounded-xl bg-white shadow-subtle">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
            <div className="text-body-sm text-muted-foreground mt-4">Loading test cases...</div>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No test cases found"
            description="Try adjusting your search or filters."
            action={
              <Button onClick={() => router.push("/test-cases/create")}>
                New Test Cases
              </Button>
            }
          />
        ) : (
          <>
            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Module</TableHeaderCell>
                  <TableHeaderCell>Severity</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Assigned</TableHeaderCell>
                  <TableHeaderCell>Updated</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((tc) => (
                  <TableRow
                    key={tc.id}
                    clickable
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/test-cases/${tc.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/test-cases/${tc.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-mono text-code text-primary-container font-medium">{tc.id}</TableCell>
                    <TableCell className="font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
                      {tc.title}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">{tc.module}</TableCell>
                    <TableCell>
                      <Badge variant={testCaseSeverityBadgeVariants[tc.severity]}>{tc.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={testCaseStatusBadgeVariants[tc.status]}>{tc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={testCaseTypeBadgeVariants[tc.type]}>{tc.type}</Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">{tc.assignedTo || "-"}</TableCell>
                    <TableCell className="text-outline">{formatDate(tc.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>

            {/* Sentinel element for infinite scroll */}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-body-sm">Loading more test cases...</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-body-sm text-muted-foreground pt-2">
              Showing {items.length} of {total} test cases
            </div>
          </>
        )}
      </PageContainer>

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        currentFilters={advancedFilters}
        onApply={setAdvancedFilters}
      />

      <ImportReviewModal
        isOpen={isParseResultOpen}
        parseResult={parseResult}
        onClose={() => { setIsParseResultOpen(false); setParseResult(null); }}
        onComplete={handleImportComplete}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onParseSuccess={(result) => {
          setParseResult(result);
          setIsParseResultOpen(true);
        }}
        onImportError={(msg) => {
          setAlertState({
            isOpen: true,
            title: "Import Failed",
            message: msg,
            type: "error",
          });
        }}
        totalCount={summary.total}
      />
    </>
  );
}

export default function TestCasesPage() {
  return (
    <Suspense fallback={<TestCasesLoading />}>
      <TestCasesContent />
    </Suspense>
  );
}
