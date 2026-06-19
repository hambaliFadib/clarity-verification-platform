import { Metadata } from "next";
import Link from "next/link";
import { PortfolioHeader } from "./components/portfolio-header";
import { CreateProjectButton } from "./components/create-project-modal";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";
import { listProjects } from "@/lib/server/qa-repository";
import { guestProjects } from "@/lib/server/guest-fixtures";

export const metadata: Metadata = {
  title: "NexQA - Enterprise Portfolio",
  description: "Enterprise multi-project dashboard",
};

export default async function PortfolioPage() {
  const ctx = await getRequestContext();
  const isGuest = isGuestContext(ctx);

  let projects = [];
  if (isGuest) {
    projects = guestProjects();
  } else {
    const { items } = await listProjects(new URLSearchParams(), ctx.userId, false);
    projects = items;
  }

  const totalProjects = projects.length;
  const qualityScore = projects.length > 0
    ? Math.round(projects.reduce((acc, p: any) => acc + (p.quality_score || 0), 0) / projects.length)
    : 100;
  const atRiskCount = projects.filter((p: any) => (p.quality_score || 0) < 80 || (p.metrics?.defects || 0) > 10).length;
  const complianceScore = projects.length > 0
    ? Math.round(projects.reduce((acc, p: any) => acc + (p.quality_score || 0) * 0.95, 0) / projects.length)
    : 100;

  return (
    <div className="text-on-background h-screen flex flex-col items-center overflow-hidden">
      <PortfolioHeader />

      {/* Main Content Canvas (Scrollable Area) */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        <main className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop py-xl flex flex-col gap-2xl pb-xl">
          {/* Header Section */}
          <section className="flex flex-col gap-sm">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary">Projects</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">Manage and access all your projects</p>
          </section>

          {/* KPI Cards Row */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-surface-container-lowest rounded-xl shadow-subtle p-5 border border-outline-variant flex justify-between items-start hover:-translate-y-px transition-all duration-200">
              <div className="flex flex-col gap-1">
                <span className="font-label-bold text-label-bold text-outline uppercase tracking-normal">Projects</span>
                <span className="font-headline-md text-headline-md font-bold text-primary">{totalProjects}</span>
              </div>
              <div className="p-2 rounded-lg bg-transparent text-primary">
                <span className="material-symbols-outlined text-[20px]">folder_open</span>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="bg-surface-container-lowest rounded-xl shadow-subtle p-5 border border-outline-variant flex justify-between items-start hover:-translate-y-px transition-all duration-200">
              <div className="flex flex-col gap-1">
                <span className="font-label-bold text-label-bold text-outline uppercase tracking-normal">Quality</span>
                <span className="font-headline-md text-headline-md font-bold text-secondary">{qualityScore}<span className="text-body-md font-normal text-on-surface-variant">/100</span></span>
              </div>
              <div className="p-2 rounded-lg bg-transparent text-secondary">
                <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="bg-surface-container-lowest rounded-xl shadow-subtle p-5 border border-outline-variant flex justify-between items-start hover:-translate-y-px transition-all duration-200">
              <div className="flex flex-col gap-1">
                <span className="font-label-bold text-label-bold text-outline uppercase tracking-normal">At Risk</span>
                <span className="font-headline-md text-headline-md font-bold text-error">{atRiskCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-transparent text-error">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="bg-surface-container-lowest rounded-xl shadow-subtle p-5 border border-outline-variant flex justify-between items-start hover:-translate-y-px transition-all duration-200">
              <div className="flex flex-col gap-1">
                <span className="font-label-bold text-label-bold text-outline uppercase tracking-normal">Compliance</span>
                <span className="font-headline-md text-headline-md font-bold text-primary">{complianceScore}%</span>
              </div>
              <div className="p-2 rounded-lg bg-transparent text-primary">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
            </div>
          </section>

          {/* Project Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {projects.map((project: any) => (
              <Link key={project.id} href={`/my-work`} passHref>
                <div className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant overflow-hidden flex flex-col hover:-translate-y-px hover:border-primary transition-all duration-200 cursor-pointer group h-full">
                  <div className={`h-1.5 ${project.status === 'Active' ? 'bg-primary' : 'bg-outline-variant'}`}></div>
                  <div className="p-4 flex flex-col gap-3 h-full">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-body-md group-hover:text-primary transition-colors">{project.name}</h3>
                      <span className={`${project.status === 'Active' ? 'bg-[#E3F2FD] text-secondary' : 'bg-surface-container text-on-surface-variant'} text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="font-headline-md text-headline-md font-bold text-on-background">{project.quality_score}</span>
                      <span className="text-label-md font-normal text-on-surface-variant mb-1">Score</span>
                    </div>
                    <div className="mt-auto pt-3 border-t border-outline-variant flex justify-between text-on-surface-variant text-[11px]">
                      <div className="flex items-center gap-1" title="Requirements"><span className="material-symbols-outlined text-[14px]">description</span> {project.metrics.requirements}</div>
                      <div className="flex items-center gap-1" title="Test Cases"><span className="material-symbols-outlined text-[14px]">inventory_2</span> {project.metrics.test_cases}</div>
                      <div className="flex items-center gap-1 text-error" title="Defects"><span className="material-symbols-outlined text-[14px]">bug_report</span> {project.metrics.defects}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full bg-surface-container-lowest rounded-xl p-8 border border-outline-variant text-center flex flex-col items-center justify-center min-h-[140px]">
                <span className="material-symbols-outlined text-[36px] text-outline mb-2">folder_off</span>
                <h3 className="font-bold text-body-lg text-on-surface">No Projects Found</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Get started by creating your first project below.</p>
              </div>
            )}

            {/* Create New Project Card */}
            <CreateProjectButton />
          </section>
        </main>
      </div>

      {/* Quick Actions (Fixed Footer) */}
      <footer className="w-full bg-surface dark:bg-on-background border-t border-outline-variant py-md px-margin-mobile md:px-margin-desktop z-50">
        <div className="w-full max-w-container-max mx-auto flex flex-wrap gap-md justify-center md:justify-start">
          <Link href="/portfolio-analytics" className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant px-lg py-sm rounded-lg font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">analytics</span> Analytics
          </Link>
          <Link href="/reports" className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant px-lg py-sm rounded-lg font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">description</span> Reports
          </Link>
          <Link href="/settings/general" className="flex items-center gap-sm bg-surface-container-lowest border border-outline-variant px-lg py-sm rounded-lg font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">settings</span> Settings
          </Link>
        </div>
      </footer>
    </div>
  );
}
