"use client";
import { useState, useEffect } from "react";
import { ChevronRight, Boxes, ExternalLink, Edit, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestCaseRow, type TestCaseNode } from "./test-case-row";
import { ActionMenu } from "./action-menu";
import { cn } from "@/lib/utils";

export interface ScenarioNode {
  id: string;
  displayId: string;
  name: string;
  description?: string;
  testCaseCount: number;
  passRate: number;
  status: "Draft" | "Ready" | "Approved";

  // Hierarchy
  moduleId?: string;
  testCases?: TestCaseNode[];
  parentScenarioId?: string;
  type?: string;
  children?: ScenarioNode[];

  // UI State
  isExpanded?: boolean;
}

interface ScenarioItemProps {
  scenario: ScenarioNode;
  isExpanded: boolean;
  onToggle: () => void;
  expandedScenarios: Set<string>;
  onToggleScenario: (scenarioId: string) => void;
  onScenarioClick?: (scenarioId: string) => void;
  onTestCaseClick?: (testCaseId: string) => void;
  onEdit?: (scenario: ScenarioNode) => void;
  onDelete?: (scenario: ScenarioNode) => void;
  onAddTestCase?: (scenarioId: string) => void;
}

export function ScenarioItem({
  scenario,
  isExpanded,
  onToggle,
  expandedScenarios,
  onToggleScenario,
  onScenarioClick,
  onTestCaseClick,
  onEdit,
  onDelete,
  onAddTestCase,
}: ScenarioItemProps) {
  const [testCases, setTestCaseNodes] = useState<TestCaseNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setLoading(true);
      fetch(`/api/test-cases?scenarioId=${scenario.id}`)
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => {
          const items = data.items || [];
          setTestCaseNodes(
            items.map((tc: any) => ({
              id: tc.id,
              displayId: tc.id,
              title: tc.title,
              severity: tc.severity,
              status: tc.status,
              updatedAt: tc.updatedAt,
            }))
          );
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isExpanded, scenario.id]);

  return (
    <div className="border border-outline-variant rounded-xl bg-white shadow-subtle transition-shadow hover:shadow-elevated">
      {/* Scenario Header */}
      <div
        className={cn(
          "flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container-low transition-colors rounded-t-xl",
          !isExpanded && "rounded-b-xl",
          isExpanded && "bg-surface-container-low/50"
        )}
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
          <ChevronRight className="h-3 w-3 text-on-surface-variant" />
        </button>

        {/* Scenario Icon */}
        <div className="bg-secondary/10 p-1.5 rounded-md">
          <Boxes className="h-4 w-4 text-secondary" />
        </div>

        {/* Scenario Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-body-md font-semibold text-on-surface">
              {scenario.name}
            </span>
            {scenario.type && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0.5 font-bold rounded-full">
                {scenario.type}
              </Badge>
            )}
          </div>
          {scenario.description && (
            <p className="text-body-sm text-on-surface-variant truncate">
              {scenario.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-body-sm mr-4">
          <div className="text-center w-24">
            <div className="font-semibold text-on-surface">{scenario.testCaseCount || 0}</div>
            <div className="text-on-surface-variant text-xs uppercase tracking-wider">Cases</div>
          </div>
          <div className="text-center w-24">
            <div className={cn(
              "font-semibold",
              (scenario.passRate || 0) >= 80 ? "text-success" :
              (scenario.passRate || 0) >= 60 ? "text-warning" : "text-error"
            )}>
              {scenario.passRate || 0}%
            </div>
            <div className="text-on-surface-variant text-xs uppercase tracking-wider">Pass Rate</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* View Link */}
          <button
            className="p-1.5 rounded-md hover:bg-surface-container-high transition-colors opacity-50 cursor-not-allowed"
            onClick={(e) => {
              e.stopPropagation();
              // onScenarioClick?.(scenario.id);
            }}
            title="Coming soon"
          >
            <ExternalLink className="h-3.5 w-3.5 text-on-surface-variant" />
          </button>

          {/* Actions */}
          <ActionMenu
            onOpen={() => {
              if (!isExpanded) onToggle();
            }}
            items={[
              {
                label: "Edit Scenario",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => onEdit?.(scenario),
              },
              {
                label: "Add Test Case",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => onAddTestCase?.(scenario.id),
              },
              {
                label: "Delete Scenario",
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => onDelete?.(scenario),
                variant: "danger",
              },
            ]}
          />
        </div>
      </div>

      {/* Expanded Test Cases & Sub-Scenarios */}
      {isExpanded && (
        <div className="border-t border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant/50">
          {/* Render Sub-Scenarios if any */}
          {scenario.children && scenario.children.length > 0 && (
            <div className="p-4 pl-8 bg-surface-container-low/20 space-y-3">
              <div className="text-[10px] font-bold text-outline uppercase tracking-wider">
                Sub-Scenarios
              </div>
              <div className="space-y-3">
                {scenario.children.map((child) => (
                  <ScenarioItem
                    key={child.id}
                    scenario={child}
                    isExpanded={expandedScenarios.has(child.id)}
                    onToggle={() => onToggleScenario(child.id)}
                    expandedScenarios={expandedScenarios}
                    onToggleScenario={onToggleScenario}
                    onScenarioClick={onScenarioClick}
                    onTestCaseClick={onTestCaseClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddTestCase={onAddTestCase}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Render Test Cases */}
          {testCases && testCases.length > 0 ? (
            <div className="p-2 space-y-1">
              {testCases.map(tc => (
                <TestCaseRow
                  key={tc.id}
                  testCase={tc}
                  onClick={() => onTestCaseClick?.(tc.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-on-surface-variant text-body-sm">
              {!loading && (
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-body-xs text-on-surface-variant/70 mb-1">No test cases directly under this scenario</span>
                  <Button variant="link" className="px-1 py-0 h-auto text-xs" onClick={() => onAddTestCase?.(scenario.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Test Case
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
