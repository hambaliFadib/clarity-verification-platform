"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { Plus, FlaskConical, CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  priorityBadgeVariants,
  testCaseStatusBadgeVariants,
  testCaseTypeBadgeVariants,
} from "@/lib/badge-variants";
import type { TestCase } from "@/lib/types";

export default function TestCasesPage() {
  const router = useRouter();
  const [allCases, setAllCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");

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

    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { label: "All", count: totalCount, value: "all" },
    { label: "Draft", count: allCases.filter((t) => t.status === "Draft").length, value: "draft" },
    { label: "Ready", count: allCases.filter((t) => t.status === "Ready").length, value: "ready" },
    { label: "In Review", count: allCases.filter((t) => t.status === "In Review").length, value: "in-review" },
    { label: "Approved", count: approvedCount, value: "approved" },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading test cases...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Test Cases"
        subtitle="Manage and organize your test case library"
        actions={
          <Link href="/test-cases/create">
            <Button>
              <Plus className="h-4 w-4" />
              Create Test Case
            </Button>
          </Link>
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
      <SearchFilter placeholder="Search test cases..." value={search} onChange={setSearch} />

      <div className="overflow-x-auto bg-white border border-outline-variant rounded-xl shadow-subtle">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">ID</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Title</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Module</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-outline uppercase tracking-normal">Priority</th>
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
                  <Badge variant={priorityBadgeVariants[tc.priority]}>{tc.priority}</Badge>
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
  );
}
