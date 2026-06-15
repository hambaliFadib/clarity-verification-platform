import { Metadata } from "next";
import { ProjectCard } from "@/components/portfolio/project-card";
import { CompliancePanel } from "@/components/portfolio/compliance-panel";
import { ResourceAllocation } from "@/components/portfolio/resource-allocation";
import { ReportDownload } from "@/components/reports/report-download";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, ShieldAlert, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Portfolio | NexQA",
  description: "Enterprise multi-project dashboard",
};

async function getPortfolioSummary() {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/portfolio/summary`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PortfolioPage() {
  const summary = await getPortfolioSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Portfolio</h1>
        <p className="text-muted-foreground">
          Cross-project visibility, quality metrics, and resource optimization.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_projects || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.active_projects || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Quality Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.overall_quality_score || 0}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on test coverage and defect rates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects at Risk</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {summary?.projects?.filter((p: any) => p.quality_score < 70).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Content - Project List */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {summary?.projects?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {summary.projects.map((project: any) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  No projects found. Create a project to see portfolio metrics.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Compliance & Resources */}
        <div className="md:col-span-2 space-y-6">
          <CompliancePanel />
          <ResourceAllocation />
          <ReportDownload />
        </div>
      </div>
    </div>
  );
}
