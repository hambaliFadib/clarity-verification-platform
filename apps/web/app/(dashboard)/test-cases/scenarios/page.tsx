"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { TestCasesTabs } from "@/components/test-cases/test-cases-tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Search } from "lucide-react";
import { ScenarioTree } from "@/components/test-cases/scenario-tree";
import type { ScenarioNode } from "@/components/test-cases/scenario-item";
import { ImportExportModal } from "@/components/test-cases/import-export-modal";
import { Select } from "@/components/ui/select";


function ScenariosLoading() {
  return (
    <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      <div className="text-body-sm text-muted-foreground">Loading scenarios...</div>
    </div>
  );
}

function ScenariosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expandId = searchParams.get("expand") || undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [scenarios, setScenarios] = useState<ScenarioNode[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const fetchScenarios = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/test-cases/scenarios");
      if (res.ok) {
        const data = await res.json();
        // data is TcScenario[]
        const nodes: ScenarioNode[] = data.map((sc: any) => ({
          id: sc.id,
          displayId: sc.id,
          name: sc.name,
          description: sc.description || "",
          testCaseCount: sc.testCaseCount || 0,
          passRate: sc.passRate !== undefined ? sc.passRate : 100,
          status: "Approved",
          moduleId: sc.moduleId || undefined,
          parentScenarioId: sc.parentScenarioId || undefined,
          type: sc.type || undefined,
        }));
        setScenarios(nodes);
      }
    } catch (err) {
      console.error("Failed to fetch scenarios", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch("/api/test-cases/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch (err) {
      console.error("Failed to fetch modules", err);
    }
  };

  useEffect(() => {
    fetchScenarios();
    fetchModules();
  }, []);

  const filteredScenarios = scenarios.filter(scn => {
    const matchesSearch = scn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scn.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModuleId === "all" || scn.moduleId === selectedModuleId;
    return matchesSearch && matchesModule;
  });

  const handleDeleteScenario = async (scenario: ScenarioNode) => {
    if (confirm(`Are you sure you want to delete scenario "${scenario.name}"?`)) {
      try {
        const res = await fetch(`/api/test-cases/scenarios/${scenario.id}`, { method: "DELETE" });
        if (res.ok) {
          fetchScenarios();
        } else {
          alert("Failed to delete scenario");
        }
      } catch (err) {
        console.error(err);
        alert("Error deleting scenario");
      }
    }
  };

  return (
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
              <Upload className="h-4 w-4 mr-2" /> Import / Export
            </Button>
            <Button onClick={() => router.push("/test-cases/scenarios/create")}>
              <Plus className="h-4 w-4 mr-2" /> New Scenario
            </Button>
          </div>
        }
      />

      <TestCasesTabs />

      <div className="mb-6 flex items-center gap-4 justify-between">
        <div className="flex-1"></div>
        <div className="flex items-center gap-3">
          {/* Module Filter Select */}
          <Select
            value={selectedModuleId}
            onChange={(val) => setSelectedModuleId(val)}
            options={[
              { label: "All Modules", value: "all" },
              ...modules.map((m) => ({ label: m.name, value: m.id }))
            ]}
            className="min-w-[200px]"
          />

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-[250px] rounded-lg border border-outline-variant bg-white text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
      </div>

      <ScenarioTree
        scenarios={filteredScenarios}
        initialExpandedId={expandId}
        onScenarioClick={(id) => router.push(`/test-cases/scenarios/${id}`)}
        onTestCaseClick={(id) => router.push(`/test-cases/${id}`)}
        onEditScenario={(scn) => router.push(`/test-cases/scenarios/${scn.id}/edit`)}
        onDeleteScenario={handleDeleteScenario}
        onAddTestCase={(scenarioId) => router.push(`/test-cases/create?scenarioId=${scenarioId}`)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onParseSuccess={(result) => {
          console.log(result);
        }}
        onImportError={(msg) => {
          alert(msg);
        }}
        totalCount={scenarios.reduce((acc, scn) => acc + scn.testCaseCount, 0)}
      />
    </PageContainer>
  );
}

export default function ScenariosPage() {
  return (
    <Suspense fallback={<ScenariosLoading />}>
      <ScenariosContent />
    </Suspense>
  );
}
