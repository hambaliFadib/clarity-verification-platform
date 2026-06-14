"use client";

import { KpiCard } from "@/components/ui/kpi-card";
import type { Requirement } from "@/lib/types";

interface RequirementStatsProps {
  requirements: Requirement[];
}

export function RequirementStats({ requirements }: RequirementStatsProps) {
  const criticalCount = requirements.filter((r) => r.priority === "Critical").length;
  const highCount = requirements.filter((r) => r.priority === "High").length;
  const mediumCount = requirements.filter((r) => r.priority === "Medium").length;
  const totalCount = requirements.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <KpiCard label="TOTAL" value={totalCount} />
      <KpiCard 
        label="CRITICAL" 
        value={criticalCount} 
        valueColor="text-error" 
        hoverBorderColor="hover:border-error" 
      />
      <KpiCard 
        label="HIGH" 
        value={highCount} 
        hoverBorderColor="hover:border-orange-400" 
      />
      <KpiCard 
        label="MEDIUM" 
        value={mediumCount} 
        hoverBorderColor="hover:border-primary-fixed-dim" 
      />
    </div>
  );
}
