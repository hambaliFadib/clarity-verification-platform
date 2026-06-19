import { useMemo, useState } from "react";
import { ScenarioItem, type ScenarioNode } from "./scenario-item";

interface ScenarioTreeProps {
  scenarios: ScenarioNode[];
  onScenarioClick?: (scenarioId: string) => void;
  onTestCaseClick?: (testCaseId: string) => void;
  onEditScenario?: (scenario: ScenarioNode) => void;
  onDeleteScenario?: (scenario: ScenarioNode) => void;
  onAddTestCase?: (scenarioId: string) => void;
}

export function ScenarioTree({
  scenarios,
  onScenarioClick,
  onTestCaseClick,
  onEditScenario,
  onDeleteScenario,
  onAddTestCase,
}: ScenarioTreeProps) {
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  const toggleScenario = (scenarioId: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(scenarioId)) {
        next.delete(scenarioId);
      } else {
        next.add(scenarioId);
      }
      return next;
    });
  };

  const scenarioTree = useMemo(() => {
    const map = new Map<string, ScenarioNode>();
    scenarios.forEach(sc => {
      map.set(sc.id, { ...sc, children: [] });
    });

    const roots: ScenarioNode[] = [];

    scenarios.forEach(sc => {
      const node = map.get(sc.id)!;
      if (sc.parentScenarioId && map.has(sc.parentScenarioId)) {
        const parent = map.get(sc.parentScenarioId)!;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [scenarios]);

  if (scenarioTree.length === 0) {
    return (
      <div className="text-center py-16 border border-outline-variant border-dashed rounded-xl bg-surface-container-lowest text-on-surface-variant">
        <p className="text-body-lg font-medium mb-1">No scenarios found.</p>
        <p className="text-body-sm text-muted-foreground">Create a scenario to start organizing your test cases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {scenarioTree.map(scenario => (
        <ScenarioItem
          key={scenario.id}
          scenario={scenario}
          isExpanded={expandedScenarios.has(scenario.id)}
          onToggle={() => toggleScenario(scenario.id)}
          expandedScenarios={expandedScenarios}
          onToggleScenario={toggleScenario}
          onScenarioClick={onScenarioClick}
          onTestCaseClick={onTestCaseClick}
          onEdit={onEditScenario}
          onDelete={onDeleteScenario}
          onAddTestCase={onAddTestCase}
        />
      ))}
    </div>
  );
}

