"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { TestCasesTabs } from "@/components/test-cases/test-cases-tabs";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Search } from "lucide-react";
import { ScenarioTree } from "@/components/test-cases/scenario-tree";
import type { ScenarioNode } from "@/components/test-cases/scenario-item";
import { ImportExportModal } from "@/components/test-cases/import-export-modal";

export default function ScenariosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [scenarios, setScenarios] = useState<ScenarioNode[]>([]);

  // Modal states
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const filteredScenarios = scenarios.filter(scn =>
    scn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scn.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteScenario = (scenario: ScenarioNode) => {
    if (confirm(`Are you sure you want to delete scenario "${scenario.name}"?`)) {
      setScenarios(scenarios.filter(scn => scn.id !== scenario.id));
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

      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1"></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-[300px] rounded-lg border border-outline-variant bg-white text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <ScenarioTree
        scenarios={filteredScenarios}
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
