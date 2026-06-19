"use client";
import { useState, useEffect } from "react";
import { ChevronRight, FolderGit2, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestCaseRow, type TestCaseNode } from "./test-case-row";
import { ActionMenu } from "./action-menu";
import { cn } from "@/lib/utils";

export interface ModuleNode {
  id: string;
  displayId: string;
  name: string;
  description?: string;
  scenarioCount: number;
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
  const [subModules, setSubModules] = useState<ModuleNode[]>([]);
  const [loading, setLoading] = useState(false);

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
              scenarioCount: 0,
              testCaseCount: sm.testCaseCount || 0,
              passRate: 100,
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
      <div
        className="flex items-center gap-4 py-3 pr-4 hover:bg-surface-container-low transition-colors group border-b border-outline-variant/30 last:border-b-0 last:rounded-b-xl"
        style={{ paddingLeft: `${Math.max(1.5, level * 3)}rem` }}
      >
        {/* Icon */}
        <FolderGit2 className="h-3.5 w-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />

        {/* Title */}
        <span className="text-body-sm text-on-surface flex-1 truncate group-hover:text-primary transition-colors">
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
            items={[
              {
                label: "Edit Sub-Module",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEdit?.(module),
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
            <div className="font-semibold text-on-surface">{module.children?.length || 0}</div>
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
