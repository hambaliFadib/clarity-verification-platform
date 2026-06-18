"use client";

import { useState } from "react";
import { ModuleItem, type ModuleNode } from "./module-item";

interface ModuleTreeProps {
  modules: ModuleNode[];
  onModuleClick?: (moduleId: string) => void;
  onTestCaseClick?: (testCaseId: string) => void;
  onEditModule?: (module: ModuleNode) => void;
  onDeleteModule?: (module: ModuleNode) => void;
  onAddSubModule?: (parentId: string) => void;
  onAddTestCase?: (moduleId: string) => void;
}

export function ModuleTree({
  modules,
  onModuleClick,
  onTestCaseClick,
  onEditModule,
  onDeleteModule,
  onAddSubModule,
  onAddTestCase,
}: ModuleTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());


  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };



  if (modules.length === 0) {
    return (
      <div className="text-center py-16 border border-outline-variant border-dashed rounded-xl bg-surface-container-lowest text-on-surface-variant">
        <p className="text-body-lg font-medium mb-1">No modules found.</p>
        <p className="text-body-sm text-muted-foreground">Create a module to start organizing your test cases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map(module => (
        <ModuleItem
          key={module.id}
          module={module}
          isExpanded={expandedModules.has(module.id)}
          expandedModules={expandedModules}
          onToggle={() => toggleModule(module.id)}
          onToggleSubModule={toggleModule}
          onModuleClick={onModuleClick}
          onTestCaseClick={onTestCaseClick}
          onEdit={onEditModule}
          onDelete={onDeleteModule}
          onAddSubModule={onAddSubModule}
          onAddTestCase={onAddTestCase}
        />
      ))}
    </div>
  );
}
