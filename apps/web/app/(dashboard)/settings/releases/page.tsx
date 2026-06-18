"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bug, FlaskConical, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { releaseStatusBadgeVariants } from "@/lib/badge-variants";
import type { Release } from "@/lib/types";

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadReleases() {
      const response = await fetch("/api/releases", { cache: "no-store" });
      if (isMounted && response.ok) setReleases(await response.json());
    }

    loadReleases().catch(() => {
      if (isMounted) setReleases([]);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Releases"
        subtitle="Track release milestones grouped by test case modules"
      />

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 mb-4 flex items-center gap-3 text-body-sm text-on-surface-variant">
        <Layers className="h-5 w-5 text-primary" />
        <p>Releases are currently auto-generated based on the <strong className="text-on-surface">Modules</strong> defined in your Test Cases.</p>
      </div>

      <div className="space-y-4">
        {releases.length === 0 ? (
          <div className="bg-white border border-outline-variant rounded-xl p-8 text-center text-body-md text-on-surface-variant">
            No release readiness data yet.
          </div>
        ) : releases.map((rel) => {
          const passRate = rel.totalTestCases > 0 ? Math.round((rel.passedTestCases / rel.totalTestCases) * 100) : 0;
          return (
            <div key={rel.id} className="bg-white border border-outline-variant rounded-xl p-6 hover:shadow-card transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-headline-sm font-headline font-semibold text-on-surface">{rel.version}</h3>
                    <span className="text-body-md text-on-surface-variant">- {rel.name}</span>
                    <Badge variant={releaseStatusBadgeVariants[rel.status]}>{rel.status}</Badge>
                  </div>
                  {rel.description && <p className="text-body-sm text-on-surface-variant">{rel.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-8 mb-4 text-body-sm text-on-surface-variant flex-wrap">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {rel.startDate} to {rel.targetDate}</span>
                <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> {rel.passedTestCases}/{rel.totalTestCases} tests ready</span>
                <span className="flex items-center gap-1.5">
                  <Bug className="h-3.5 w-3.5" /> {rel.totalDefects} defects
                  {rel.openDefects > 0 && <span className="text-warning font-medium">({rel.openDefects} open)</span>}
                </span>
                {rel.criticalDefects > 0 && <span className="text-error font-medium">{rel.criticalDefects} critical</span>}
              </div>
              {rel.totalTestCases > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-outline">Module Readiness</span>
                    <span className="font-bold text-on-surface">{passRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", passRate >= 70 ? "bg-emerald-500" : (passRate > 30 ? "bg-primary" : "bg-error"))}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
