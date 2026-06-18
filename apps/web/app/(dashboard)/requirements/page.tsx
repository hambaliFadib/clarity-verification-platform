"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import type { Requirement } from "@/lib/types";
import { RequirementStats } from "@/components/requirements/requirement-stats";
import { RequirementTable } from "@/components/requirements/requirement-table";
import { ImportExportModal } from "@/components/requirements/import-export-modal";


export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRequirements() {
      try {
        const response = await fetch("/api/requirements", { cache: "no-store" });
        if (response.ok && isMounted) {
          setRequirements(await response.json());
        }
      } catch (error) {
        console.error("Failed to load requirements", error);
      }
    }
    loadRequirements();
    return () => { isMounted = false; };
  }, []);


  const totalCount = requirements.length;

  const statusTabs = [
    { label: "All", count: totalCount, value: "all" },
    { label: "Draft", count: requirements.filter((r) => r.status === "Draft").length, value: "draft" },
    { label: "Ready", count: requirements.filter((r) => r.status === "Ready").length, value: "ready" },
    { label: "In Review", count: requirements.filter((r) => r.status === "In Review").length, value: "in review" },
    { label: "Approved", count: requirements.filter((r) => r.status === "Approved").length, value: "approved" },
  ];

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      if (activeTab !== "all" && req.status.toLowerCase() !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          req.title.toLowerCase().includes(q) ||
          req.displayId.toLowerCase().includes(q) ||
          req.module.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requirements, activeTab, searchQuery]);

  return (
    <PageContainer>
      <PageHeader
        title="Requirements"
        subtitle="Manage and track product requirements"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button variant="outline" onClick={() => setIsExportModalOpen(true)}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Link href="/requirements/create">
              <Button>
                <Plus className="h-4 w-4" /> New Requirement
              </Button>
            </Link>
          </div>
        }
      />

      <RequirementStats requirements={requirements} />

      <StatusTabs tabs={statusTabs} defaultValue="all" onChange={setActiveTab} />

      <SearchFilter
        placeholder="Search requirements by ID, title, or module..."
        value={searchQuery}
        onChange={setSearchQuery}
      />

      <RequirementTable requirements={filteredRequirements} />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="import"
      />
      <ImportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="export"
      />
    </PageContainer>
  );
}
