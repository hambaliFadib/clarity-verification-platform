"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { QualityScore } from "@/components/dashboard/quality-score";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) {
    return <div className="p-6 animate-pulse">Loading analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader title="Analytics" subtitle="Quality intelligence dashboard" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="REQUIREMENTS" value={stats.requirements?.total || 0} />
        <KpiCard label="TEST CASES" value={stats.test_cases?.total || 0} />
        <KpiCard label="TEST RUNS" value={stats.test_runs?.total || 0} />
        <KpiCard label="DEFECTS" value={stats.defects?.total || 0} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <QualityScore score={stats.quality_score || 0} />
        
        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold mb-4">Requirements by Status</h3>
          <div className="space-y-2">
            {Object.entries(stats.requirements?.by_status || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">{status}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold mb-4">Defects by Severity</h3>
          <div className="space-y-2">
            {Object.entries(stats.defects?.by_severity || {}).map(([severity, count]) => (
              <div key={severity} className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">{severity}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
          <h3 className="text-body-lg font-semibold mb-4">Test Run Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-on-surface-variant">Avg Pass Rate</span>
              <span className="font-medium text-success">{stats.test_runs?.avg_pass_rate || 0}%</span>
            </div>
            {Object.entries(stats.test_runs?.by_status || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm text-on-surface-variant">{status}</span>
                <span className="font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
