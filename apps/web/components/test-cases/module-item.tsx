"use client";
import { useState, useEffect } from "react";
import { ChevronRight, FolderGit2, Plus, Edit, Trash2, Boxes } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestCaseRow, type TestCaseNode } from "./test-case-row";
import { ActionMenu } from "./action-menu";
import { cn } from "@/lib/utils";
import { ScenarioItem } from "./scenario-item";
import { useRouter } from "next/navigation";

export interface ModuleNode {
  id: string;
  displayId: string;
  name: string;
  description?: string;
  scenarioCount: number;
  subModuleCount?: number;
  testCaseCount: number;
  passRate: number;
  status: "Active" | "Inactive";

  // Hierarchy
  parentId?: string;
  children?: ModuleNode[];
  testCases?: TestCaseNode[];

  // UI State
  isExpanded?: boolean;
}

interface ModuleItemProps {
  module: ModuleNode;
  isExpanded: boolean;
  expandedModules: Set<string>;
  onToggle: () => void;
  onToggleSubModule: (id: string) => void;
  onModuleClick?: (moduleId: string) => void;
  onTestCaseClick?: (testCaseId: string) => void;
  onEdit?: (module: ModuleNode) => void;
  onDelete?: (module: ModuleNode) => void;
  onAddSubModule?: (parentId: string) => void;
  onAddTestCase?: (moduleId: string) => void;
  level?: number;
}

export function ModuleItem({
  module,
  isExpanded,
  expandedModules,
  onToggle,
  onToggleSubModule,
  onModuleClick,
  onTestCaseClick,
  onEdit,
  onDelete,
  onAddSubModule,
  onAddTestCase,
  level = 0,
}: ModuleItemProps) {
  const router = useRouter();
  const [subModules, setSubModules] = useState<ModuleNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [scenariosLoading, setScenariosLoading] = useState(false);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  const toggleScenario = (scenarioId: string) => {
    setExpandedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(scenarioId)) {
        next.delete(scenarioId);
      } else {
        next.add(scenarioId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (level > 0 && isExpanded) {
      setScenariosLoading(true);
      fetch(`/api/test-cases/scenarios?subModuleId=${module.id}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setScenarios(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setScenariosLoading(false));
    }
  }, [level, isExpanded, module.id]);

  useEffect(() => {
    if (isExpanded && level === 0) {
      setLoading(true);
      fetch(`/api/test-cases/modules/${module.id}/sub-modules`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setSubModules(
            data.map((sm: any) => ({
              id: sm.id,
              displayId: sm.id,
              name: sm.name,
              description: sm.description,
              scenarioCount: sm.scenarioCount || 0,
              testCaseCount: sm.testCaseCount || 0,
              passRate: sm.passRate !== undefined ? sm.passRate : 100,
              status: "Active",
              parentId: module.id,
            }))
          );
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isExpanded, module.id, level]);

  if (level > 0) {
    return (
      <div className="border-b border-outline-variant/30 last:border-b-0">
        {/* Sub-Module Header */}
        <div
          className="flex items-center gap-4 py-3 pr-4 hover:bg-surface-container-low transition-colors group cursor-pointer"
          style={{ paddingLeft: `${Math.max(1.5, level * 3)}rem` }}
          onClick={onToggle}
        >
          {/* Chevron */}
          <button
            className={cn(
              "p-0.5 rounded-md hover:bg-surface-container-high transition-colors",
              isExpanded && "rotate-90"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <ChevronRight className="h-3.5 w-3.5 text-on-surface-variant" />
          </button>

          {/* Icon */}
          <FolderGit2 className="h-3.5 w-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />

          {/* Title */}
          <span className="text-body-sm font-medium text-on-surface flex-1 truncate group-hover:text-primary transition-colors">
            {module.name}
          </span>

          {/* Sub-Module stats */}
          <div className="hidden sm:flex items-center gap-6 text-body-sm mr-4">
            <div className="text-center w-24">
              <div className="font-semibold text-on-surface">{module.scenarioCount || 0}</div>
              <div className="text-on-surface-variant text-xs uppercase tracking-wider">Scenarios</div>
            </div>
            <div className="text-center w-24">
              <div className={cn(
                "font-semibold",
                (module.passRate || 0) >= 80 ? "text-success" :
                (module.passRate || 0) >= 60 ? "text-warning" : "text-error"
              )}>
                {module.passRate || 0}%
              </div>
              <div className="text-on-surface-variant text-xs uppercase tracking-wider">Pass Rate</div>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-2">
            <ActionMenu
              onOpen={() => {
                if (!isExpanded) onToggle();
              }}
              items={[
                {
                  label: "Edit Sub-Module",
                  icon: <Edit className="h-4 w-4" />,
                  onClick: () => onEdit?.(module),
                },
                {
                  label: "Add Scenario",
                  icon: <Plus className="h-4 w-4" />,
                  onClick: () => {
                    router.push(`/test-cases/scenarios/create?moduleId=${module.parentId}&subModuleId=${module.id}`);
                  },
                },
                {
                  label: "Delete Sub-Module",
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => onDelete?.(module),
                  variant: "danger",
                },
              ]}
            />
          </div>
        </div>

        {/* Sub-Module Expanded Content (Scenarios List) */}
        {isExpanded && (
          <div 
            className="bg-surface-container-lowest/50 border-t border-outline-variant/20 py-3 pr-4 space-y-3"
            style={{ paddingLeft: `${Math.max(1.5, level * 3) + 1.5}rem` }}
          >
            {scenariosLoading && (
              <div className="text-xs text-muted-foreground py-2">Loading scenarios...</div>
            )}
            
            {!scenariosLoading && scenarios.length === 0 && (
              <div className="text-xs text-on-surface-variant py-2 flex items-center gap-2">
                <span>No scenarios in this sub-module.</span>
                <Button 
                  variant="link" 
                  className="px-1 py-0 h-auto text-xs" 
                  onClick={() => {
                    router.push(`/test-cases/scenarios/create?moduleId=${module.parentId}&subModuleId=${module.id}`);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Scenario
                </Button>
              </div>
            )}

            {!scenariosLoading && scenarios.length > 0 && (
              <div className="space-y-3">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center gap-4 py-2.5 px-3 hover:bg-surface-container-low transition-colors group rounded-lg cursor-pointer border border-outline-variant/30 bg-white"
                    onClick={() => {
                      router.push(`/test-cases/scenarios?expand=${sc.id}`);
                    }}
                  >
                    {/* Icon */}
                    <Boxes className="h-4 w-4 text-secondary group-hover:text-primary transition-colors" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-body-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {sc.name}
                        </span>
                        {sc.type && (
                          <Badge variant="info" className="text-[9px] px-1.5 py-0.5 font-bold rounded-full">
                            {sc.type}
                          </Badge>
                        )}
                      </div>
                      {sc.description && (
                        <p className="text-xs text-on-surface-variant truncate">
                          {sc.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-body-sm mr-2">
                      <div className="text-center w-20">
                        <div className="font-semibold text-on-surface text-xs">{sc.testCaseCount || 0}</div>
                        <div className="text-on-surface-variant text-[10px] uppercase tracking-wider">Cases</div>
                      </div>
                      <div className="text-center w-20">
                        <div className={cn(
                          "font-semibold text-xs",
                          (sc.passRate || 0) >= 80 ? "text-success" :
                          (sc.passRate || 0) >= 60 ? "text-warning" : "text-error"
                        )}>
                          {sc.passRate || 0}%
                        </div>
                        <div className="text-on-surface-variant text-[10px] uppercase tracking-wider">Pass Rate</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-2" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          {
                            label: "Edit Scenario",
                            icon: <Edit className="h-4 w-4" />,
                            onClick: () => {
                              router.push(`/test-cases/scenarios/${sc.id}/edit`);
                            },
                          },
                          {
                            label: "Delete Scenario",
                            icon: <Trash2 className="h-4 w-4" />,
                            onClick: async () => {
                              if (confirm(`Are you sure you want to delete scenario "${sc.name}"?`)) {
                                const res = await fetch(`/api/test-cases/scenarios/${sc.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  fetch(`/api/test-cases/scenarios?subModuleId=${module.id}`)
                                    .then((r) => (r.ok ? r.json() : []))
                                    .then((d) => setScenarios(d));
                                }
                              }
                            },
                            variant: "danger",
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-outline-variant rounded-xl bg-white shadow-subtle transition-shadow hover:shadow-elevated">
      {/* Module Header */}
      <div
        className={cn(
          "flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors rounded-t-xl",
          !isExpanded && "rounded-b-xl",
          isExpanded && "bg-surface-container-low/50",
          level > 0 && "py-3" // slightly smaller padding for sub-modules
        )}
        style={{ paddingLeft: `${Math.max(1, level * 1.5)}rem` }}
        onClick={onToggle}
      >
        {/* Expand Icon */}
        <button
          className={cn(
            "p-1 rounded-md hover:bg-surface-container-high transition-colors",
            isExpanded && "rotate-90"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ChevronRight className="h-4 w-4 text-on-surface-variant" />
        </button>

        {/* Module Icon */}
        <div className="bg-primary/10 p-2 rounded-lg">
          <FolderGit2 className="h-5 w-5 text-primary" />
        </div>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-body-md font-semibold text-on-surface">
              {module.name}
            </span>
          </div>
          {module.description && (
            <p className="text-body-sm text-on-surface-variant truncate">
              {module.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-body-sm mr-4">
          <div className="text-center w-24">
            <div className="font-semibold text-on-surface">{module.subModuleCount ?? 0}</div>
            <div className="text-on-surface-variant text-xs uppercase tracking-wider">Sub-Modules</div>
          </div>
          <div className="text-center w-24">
            <div className={cn(
              "font-semibold",
              (module.passRate || 0) >= 80 ? "text-success" :
              (module.passRate || 0) >= 60 ? "text-warning" : "text-error"
            )}>
              {module.passRate || 0}%
            </div>
            <div className="text-on-surface-variant text-xs uppercase tracking-wider">Pass Rate</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ActionMenu
            onOpen={() => {
              if (!isExpanded) onToggle();
            }}
            items={[
              {
                label: "Edit Module",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEdit?.(module),
              },
              {
                label: "Add Sub-Module",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => onAddSubModule?.(module.id),
              },
              {
                label: "Delete Module",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => onDelete?.(module),
                variant: "danger",
              },
            ]}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-outline-variant bg-surface-container-lowest rounded-b-xl">

          {/* Sub Modules List */}
          {((level === 0 ? subModules : (module.children || [])).length > 0) && (
            <div className="border-b border-outline-variant/50">
              {(level === 0 ? subModules : (module.children || [])).map(subModule => (
                <ModuleItem
                  key={subModule.id}
                  module={subModule}
                  isExpanded={expandedModules.has(subModule.id)}
                  expandedModules={expandedModules}
                  onToggle={() => onToggleSubModule(subModule.id)}
                  onToggleSubModule={onToggleSubModule}
                  onModuleClick={onModuleClick}
                  onTestCaseClick={onTestCaseClick}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddSubModule={onAddSubModule}
                  onAddTestCase={onAddTestCase}
                  level={level + 1}
                />
              ))}
            </div>
          )}

          {/* Empty State when no Sub Modules */}
          {((level === 0 ? subModules : (module.children || [])).length === 0) && !loading && (
            <div className="p-4 text-center text-on-surface-variant text-body-sm flex gap-4 justify-center items-center">
              <Button variant="link" className="px-1 py-0 h-auto" onClick={() => onAddSubModule?.(module.id)}>
                <Plus className="h-3 w-3 mr-1" /> Add Sub-Module
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
