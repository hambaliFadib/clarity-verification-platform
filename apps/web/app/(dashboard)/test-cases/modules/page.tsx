"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { TestCasesTabs } from "@/components/test-cases/test-cases-tabs";
import { ModuleTree } from "@/components/test-cases/module-tree";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Search } from "lucide-react";
import type { ModuleNode } from "@/components/test-cases/module-item";
import { ImportExportModal } from "@/components/test-cases/import-export-modal";

export default function ModulesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState<ModuleNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/test-cases/modules");
      if (res.ok) {
        const data = await res.json();
        const nodes: ModuleNode[] = data.map((m: any) => ({
          id: m.id,
          displayId: m.id,
          name: m.name,
          description: m.description || "",
          scenarioCount: 0,
          testCaseCount: m.testCaseCount || 0,
          passRate: m.passRate !== undefined ? m.passRate : 100,
          status: "Active",
          children: [],
        }));
        setModules(nodes);
      }
    } catch (err) {
      console.error("Failed to fetch modules", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const filteredModules = modules.filter(mod =>
    mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mod.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteModule = async (moduleNode: ModuleNode) => {
    const isSub = Boolean(moduleNode.parentId);
    const targetLabel = isSub ? "sub-module" : "module";
    if (confirm(`Are you sure you want to delete ${targetLabel} "${moduleNode.name}"?`)) {
      try {
        const endpoint = isSub 
          ? `/api/test-cases/sub-modules/${moduleNode.id}`
          : `/api/test-cases/modules/${moduleNode.id}`;
        const res = await fetch(endpoint, { method: "DELETE" });
        if (res.ok) {
          fetchModules();
        } else {
          alert(`Failed to delete ${targetLabel}`);
        }
      } catch (err) {
        console.error(err);
        alert(`Error deleting ${targetLabel}`);
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
            <Button onClick={() => router.push("/test-cases/modules/create")}>
              <Plus className="h-4 w-4 mr-2" /> New Module
            </Button>
          </div>
        }
      />

      <TestCasesTabs />

      <div className="mb-6 flex items-center justify-between">
        {/* Removed New Module button */}
        <div className="flex-1"></div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-[300px] rounded-lg border border-outline-variant bg-white text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <ModuleTree
        modules={filteredModules}
        onModuleClick={(id) => router.push(`/test-cases/modules/${id}`)}
        onTestCaseClick={(id) => router.push(`/test-cases/${id}`)}
        onEditModule={(mod) => router.push(`/test-cases/modules/${mod.id}/edit`)}
        onDeleteModule={handleDeleteModule}
        onAddSubModule={(parentId) => router.push(`/test-cases/modules/create?parentId=${parentId}`)}
        onAddTestCase={(moduleId) => router.push(`/test-cases/create?moduleId=${moduleId}`)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onParseSuccess={(result) => {
          // Handle import success placeholder
          console.log(result);
        }}
        onImportError={(msg) => {
          alert(msg);
        }}
        totalCount={modules.reduce((acc, mod) => acc + mod.testCaseCount, 0)}
      />
    </PageContainer>
  );
}
