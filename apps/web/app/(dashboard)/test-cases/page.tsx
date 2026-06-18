"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter, type ActiveFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
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

function TestCasesLoading() {
  return (
    <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      <div className="text-body-sm text-outline">Loading test cases...</div>
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

  // Initialize state from URL search params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeStatus, setActiveStatus] = useState(searchParams.get("status") || "all");
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

  // Advanced filters — init from URL
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<TestCaseAdvancedFilters>({
    module: searchParams.get("module") || "",
    type: (searchParams.get("type") || "") as TestCaseAdvancedFilters["type"],
    severity: (searchParams.get("severity") || "") as TestCaseAdvancedFilters["severity"],
    tags: searchParams.get("tags") || "",
  });

  // Sync filters to URL
  const syncFiltersToUrl = useCallback(
    (newSearch: string, newStatus: string, newFilters: TestCaseAdvancedFilters) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("search", newSearch);
      if (newStatus && newStatus !== "all") params.set("status", newStatus);
      if (newFilters.module) params.set("module", newFilters.module);
      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.severity) params.set("severity", newFilters.severity);
      if (newFilters.tags) params.set("tags", newFilters.tags);
      const qs = params.toString();
      const newUrl = qs ? `/test-cases?${qs}` : "/test-cases";
      window.history.replaceState(window.history.state, "", newUrl);
    },
    []
  );

  // Wrap setters to also sync URL
  const handleSearchChange = useCallback(
    (val: string) => {
      setSearch(val);
      syncFiltersToUrl(val, activeStatus, advancedFilters);
    },
    [activeStatus, advancedFilters, syncFiltersToUrl]
  );

  const handleStatusChange = useCallback(
    (val: string) => {
      setActiveStatus(val);
      syncFiltersToUrl(search, val, advancedFilters);
    },
    [search, advancedFilters, syncFiltersToUrl]
  );

  const handleAdvancedFilterApply = useCallback(
    (filters: TestCaseAdvancedFilters) => {
      setAdvancedFilters(filters);
      syncFiltersToUrl(search, activeStatus, filters);
    },
    [search, activeStatus, syncFiltersToUrl]
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      const updated = { ...advancedFilters, [key]: "" } as TestCaseAdvancedFilters;
      setAdvancedFilters(updated);
      syncFiltersToUrl(search, activeStatus, updated);
    },
    [advancedFilters, search, activeStatus, syncFiltersToUrl]
  );

  const handleResetFilters = useCallback(() => {
    const empty: TestCaseAdvancedFilters = { module: "", type: "", severity: "", tags: "" };
    setAdvancedFilters(empty);
    setSearch("");
    setActiveStatus("all");
    syncFiltersToUrl("", "all", empty);
  }, [syncFiltersToUrl]);

  // Build active filter chips
  const activeFiltersList = useMemo<ActiveFilter[]>(() => {
    const chips: ActiveFilter[] = [];
    if (advancedFilters.module) chips.push({ label: "Module", value: advancedFilters.module, key: "module" });
    if (advancedFilters.type) chips.push({ label: "Type", value: advancedFilters.type, key: "type" });
    if (advancedFilters.severity) chips.push({ label: "Severity", value: advancedFilters.severity, key: "severity" });
    if (advancedFilters.tags) chips.push({ label: "Tags", value: advancedFilters.tags, key: "tags" });
    return chips;
  }, [advancedFilters]);

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

  if (isLoading) {
    return <TestCasesLoading />;
  }

  return (
    <>
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
      />
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
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
                  <Plus className="h-4 w-4" />
                  Create Test Case
                </Button>
              </Link>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <StatusTabs tabs={statusTabs} defaultValue={activeStatus} onChange={handleStatusChange} />
        <SearchFilter
          placeholder="Search test cases..."
          value={search}
          onChange={handleSearchChange}
          onAddFilterClick={() => setIsAdvancedFilterOpen(true)}
          activeFilterCount={activeFiltersList.length}
          activeFilters={activeFiltersList}
          onRemoveFilter={handleRemoveFilter}
          onResetFilters={handleResetFilters}
        />

        <div className="overflow-x-auto bg-white border border-outline-variant rounded-xl shadow-subtle">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">ID</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Title</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Module</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Severity</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Status</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Type</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Tags</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Assigned</th>
                <th className="text-left px-3 py-1.5 text-[10px] font-bold text-outline uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {items.map((tc) => (
                <tr
                  key={tc.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/test-cases/${tc.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/test-cases/${tc.id}`);
                    }
                  }}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-fixed-dim"
                >
                  <td className="px-3 py-1.5 font-mono text-[11px] text-primary-container font-medium">{tc.id}</td>
                  <td className="px-3 py-1.5 text-xs font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
                    {tc.title}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-on-surface-variant">{tc.module}</td>
                  <td className="px-3 py-1.5">
                    <Badge variant={testCaseSeverityBadgeVariants[tc.severity]} className="text-[9px] px-1 py-0">{tc.severity}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge variant={testCaseStatusBadgeVariants[tc.status]} className="text-[9px] px-1 py-0">{tc.status}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <Badge variant={testCaseTypeBadgeVariants[tc.type]} className="text-[9px] px-1 py-0">{tc.type}</Badge>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {tc.tags && tc.tags.length > 0 ? (
                        <>
                          {tc.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {tc.tags.length > 2 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              +{tc.tags.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-outline text-[10px]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-on-surface-variant">{tc.assignedTo || "-"}</td>
                  <td className="px-3 py-1.5 text-xs text-outline">{formatDate(tc.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sentinel element for infinite scroll */}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-outline">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-body-sm">Loading more test cases...</span>
              </div>
            )}
          </div>
        )}

        <div className="text-body-sm text-on-surface-variant">
          Showing {items.length} of {total} test cases
        </div>
      </div>

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        currentFilters={advancedFilters}
        onApply={handleAdvancedFilterApply}
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
