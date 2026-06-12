"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, CheckCircle2, XCircle, Clock, Upload } from "lucide-react";
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

function TestCasesLoading() {
  return (
    <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      <div className="text-body-sm text-outline">Loading test cases...</div>
    </div>
  );
}

function TestCasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allCases, setAllCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (toastType === "deleted") {
      setAlertState({
        isOpen: true,
        title: "Test Case Deleted",
        message: "The test case was deleted successfully.",
        type: "success",
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTestCases() {
      try {
        const res = await fetch("/api/test-cases");
        if (res.ok) {
          const data = await res.json();
          setAllCases(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTestCases();
  }, []);

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
    async function reload() {
      const res = await fetch("/api/test-cases");
      if (res.ok) setAllCases(await res.json());
    }
    reload();
  }

  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<TestCaseAdvancedFilters>({
    module: "",
    type: "",
    severity: "",
    tags: "",
  });

  const availableModules = Array.from(new Set(allCases.map(tc => tc.module)));

  const totalCount = allCases.length;
  const approvedCount = allCases.filter((tc) => tc.status === "Approved").length;
  const failedCount = allCases.filter((tc) => tc.steps?.some((s) => s.status === "Failed")).length;
  const reviewCount = allCases.filter((tc) => tc.status === "In Review" || tc.status === "Draft").length;

  const filteredCases = allCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(search.toLowerCase()) ||
      tc.module.toLowerCase().includes(search.toLowerCase()) ||
      tc.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      activeStatus === "all" ||
      tc.status.toLowerCase() === activeStatus.replace(/-/g, " ").toLowerCase();

    const matchesModule = !advancedFilters.module || tc.module === advancedFilters.module;
    const matchesType = !advancedFilters.type || tc.type === advancedFilters.type;
    const matchesSeverity = !advancedFilters.severity || tc.severity === advancedFilters.severity;
    
    let matchesTags = true;
    if (advancedFilters.tags) {
      const q = advancedFilters.tags.toLowerCase();
      matchesTags = !!tc.tags && tc.tags.some(tag => tag.toLowerCase().includes(q));
    }

    return matchesSearch && matchesStatus && matchesModule && matchesType && matchesSeverity && matchesTags;
  });

  const statusTabs = [
    { label: "All", count: totalCount, value: "all" },
    { label: "Draft", count: allCases.filter((t) => t.status === "Draft").length, value: "draft" },
    { label: "Ready", count: allCases.filter((t) => t.status === "Ready").length, value: "ready" },
    { label: "In Review", count: allCases.filter((t) => t.status === "In Review").length, value: "in-review" },
    { label: "Approved", count: approvedCount, value: "approved" },
  ];

  if (loading) {
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
          <KpiCard label="Total" value={totalCount} icon={FlaskConical} />
          <KpiCard
            label="Approved"
            value={approvedCount}
            icon={CheckCircle2}
            valueColor="text-emerald-600"
            iconColor="text-emerald-600"
            hoverBorderColor="hover:border-emerald-500"
          />
          <KpiCard
            label="Has Failures"
            value={failedCount}
            icon={XCircle}
            valueColor="text-error"
            iconColor="text-error"
            hoverBorderColor="hover:border-error"
          />
          <KpiCard
            label="In Review / Draft"
            value={reviewCount}
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

        <div className="overflow-x-auto bg-white border border-outline-variant rounded-xl shadow-subtle">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">ID</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Title</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Module</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Severity</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Type</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Assigned</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {filteredCases.map((tc) => (
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
                  <td className="px-4 py-3 font-mono text-code text-primary-container font-medium">{tc.id}</td>
                  <td className="px-4 py-3 text-body-sm font-medium text-on-surface group-hover:text-primary transition-colors max-w-xs truncate">
                    {tc.title}
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{tc.module}</td>
                  <td className="px-4 py-3">
                    <Badge variant={testCaseSeverityBadgeVariants[tc.severity]}>{tc.severity}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={testCaseStatusBadgeVariants[tc.status]}>{tc.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={testCaseTypeBadgeVariants[tc.type]}>{tc.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant">{tc.assignedTo || "-"}</td>
                  <td className="px-4 py-3 text-body-sm text-outline">{formatDate(tc.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-body-sm text-on-surface-variant">
          Showing {filteredCases.length} of {totalCount} test cases
        </div>
      </div>

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        currentFilters={advancedFilters}
        onApply={setAdvancedFilters}
        availableModules={availableModules}
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
        totalCount={totalCount}
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
