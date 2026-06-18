"use client";
import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatusTabs } from "@/components/ui/status-tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, ChevronDown, ChevronRight, Bug, FileWarning } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Defect, Environment, TestCase, TestRun } from "@/lib/types";
import { ReportDefectModal } from "@/components/defects/report-defect-modal";
import { AdvancedFilterModal, type AdvancedFilters } from "@/components/defects/advanced-filter-modal";
import { getDefectStatusBadgeVariant, severityBadgeVariants } from "@/lib/badge-variants";

export default function DefectsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [localDefects, setLocalDefects] = useState<Defect[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("open");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    severity: "",
    type: "",
    priority: "",
    tags: ""
  });

  useEffect(() => {
    let isMounted = true;

    async function loadDefectData() {
      const [defectResponse, testCaseResponse, testRunResponse, environmentResponse] = await Promise.all([
        fetch("/api/defects", { cache: "no-store" }),
        fetch("/api/test-cases", { cache: "no-store" }),
        fetch("/api/test-runs", { cache: "no-store" }),
        fetch("/api/environments", { cache: "no-store" }),
      ]);

      if (!isMounted) return;
      if (defectResponse.ok) setLocalDefects(await defectResponse.json());
      if (testCaseResponse.ok) {
        const tcData = await testCaseResponse.json();
        setTestCases(Array.isArray(tcData) ? tcData : tcData.items || []);
      }
      if (testRunResponse.ok) setTestRuns(await testRunResponse.json());
      if (environmentResponse.ok) setEnvironments(await environmentResponse.json());
    }

    loadDefectData().catch(() => {
      if (isMounted) setLocalDefects([]);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const criticalCount = localDefects.filter((d) => d.severity === "Critical").length;
  const highCount = localDefects.filter((d) => d.severity === "High").length;
  const mediumCount = localDefects.filter((d) => d.severity === "Medium").length;
  const lowCount = localDefects.filter((d) => d.severity === "Low").length;

  const statusTabs = [
    { label: "All", count: localDefects.length, value: "all" },
    { label: "Open", count: localDefects.filter((d) => d.status === "Open").length, value: "open" },
    { label: "In Progress", count: localDefects.filter((d) => d.status === "In Progress").length, value: "in progress" },
    { label: "Resolved", count: localDefects.filter((d) => d.status === "Resolved").length, value: "resolved" },
    { label: "Closed", count: localDefects.filter((d) => d.status === "Closed").length, value: "closed" },
    { label: "Blocked", count: localDefects.filter((d) => d.status === "Blocked").length, value: "blocked" },
  ];

  const filteredDefects = useMemo(() => {
    return localDefects.filter(defect => {
      if (activeTab !== "all" && defect.status.toLowerCase() !== activeTab) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = defect.title.toLowerCase().includes(q);
        const matchesDesc = defect.description?.toLowerCase().includes(q);
        const matchesId = defect.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesId) return false;
      }

      if (advancedFilters.severity && defect.severity !== advancedFilters.severity) return false;
      if (advancedFilters.type && defect.type !== advancedFilters.type) return false;
      if (advancedFilters.priority && defect.priority !== advancedFilters.priority) return false;

      if (advancedFilters.tags) {
        const q = advancedFilters.tags.toLowerCase();
        if (!defect.tags || !defect.tags.some(tag => tag.toLowerCase().includes(q))) {
          return false;
        }
      }

      return true;
    });
  }, [localDefects, activeTab, searchQuery, advancedFilters]);

  const grouped = filteredDefects.reduce<Record<string, Defect[]>>((acc, d) => {
    const key = d.linkedTestRun || "Manual";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (key: string) => expandedGroups[key] !== false;

  const handleCreateDefect = async (newDefect: Defect) => {
    const response = await fetch("/api/defects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDefect),
    });
    if (!response.ok) return;

    const result = await response.json();
    const createdDefect: Defect = result.defect;
    setLocalDefects([createdDefect, ...localDefects]);

    const event = new CustomEvent("new-activity", {
      detail: {
        id: `act-${Date.now()}`,
        user: createdDefect.reportedBy || "Unassigned",
        userInitials: sessionUser?.initials || "??",
        action: "reported",
        targetType: "defect",
        targetId: createdDefect.id,
        targetTitle: createdDefect.title,
        timestamp: createdDefect.createdAt
      }
    });
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event.detail),
    }).catch(() => undefined);
    window.dispatchEvent(event);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Defects"
          subtitle="Track and manage bugs found during testing"
          actions={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4" /> Report Defect
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard label="Critical" value={criticalCount} valueColor="text-error" hoverBorderColor="hover:border-error" />
          <KpiCard label="High" value={highCount} hoverBorderColor="hover:border-orange-400" />
          <KpiCard label="Medium" value={mediumCount} hoverBorderColor="hover:border-primary-fixed-dim" />
          <KpiCard label="Low" value={lowCount} hoverBorderColor="hover:border-outline" />
        </div>

        <StatusTabs tabs={statusTabs} defaultValue="open" onChange={setActiveTab} />

        <SearchFilter
          placeholder="Search defects by ID, title, or description..."
          value={searchQuery}
          onChange={setSearchQuery}
          onAddFilterClick={() => setIsAdvancedFilterOpen(true)}
        />

        <div className="space-y-3">
          {Object.keys(grouped).length === 0 ? (
            <EmptyState
              icon={Bug}
              title="No defects found"
              description="Try adjusting your search or filters."
            />
          ) : (
            Object.entries(grouped).map(([groupName, items]) => (
              <section key={groupName} className="bg-card border border-outline-variant rounded-lg overflow-hidden shadow-subtle">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full bg-surface-container-low px-4 py-2.5 border-b border-outline-variant flex items-center justify-between hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {groupName === "Manual" ? <FileWarning className="h-4 w-4 text-outline" /> : <Bug className="h-4 w-4 text-outline" />}
                    <span className="text-body-md font-medium">{groupName === "Manual" ? "Manual" : `Run: ${groupName}`}</span>
                    <span className="bg-card border border-outline-variant text-label-sm font-semibold px-1.5 py-0.5 rounded">{items.length}</span>
                  </div>
                  {isExpanded(groupName) ? <ChevronDown className="h-4 w-4 text-outline" /> : <ChevronRight className="h-4 w-4 text-outline" />}
                </button>
                {isExpanded(groupName) && (
                  <div className="divide-y divide-outline-variant/50">
                    {items.map((d) => (
                      <Link key={d.id} href={`/defects/${d.id}`} className="block p-4 hover:bg-surface-container-low transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={severityBadgeVariants[d.severity]}>{d.severity}</Badge>
                              <Badge variant={getDefectStatusBadgeVariant(d.status)}>{d.status}</Badge>
                              {d.type !== "Bug" && <Badge variant="outline">{d.type}</Badge>}
                            </div>
                            <h4 className="text-body-md font-medium text-on-surface">{d.title}</h4>
                            {d.description && <p className="text-body-sm text-muted-foreground line-clamp-1">{d.description}</p>}
                          </div>
                          <span className="text-caption text-outline flex-shrink-0 ml-4">{timeAgo(d.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))
          )}
        </div>

        <div className="flex justify-between items-center text-caption text-muted-foreground pt-2">
          <span>Showing {filteredDefects.length} of {localDefects.length} total entries</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            System Operational
          </div>
        </div>
      </PageContainer>

      <ReportDefectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateDefect}
        testCases={testCases}
        testRuns={testRuns}
        environments={environments}
      />

      <AdvancedFilterModal
        isOpen={isAdvancedFilterOpen}
        onClose={() => setIsAdvancedFilterOpen(false)}
        currentFilters={advancedFilters}
        onApply={setAdvancedFilters}
      />
    </>
  );
}
