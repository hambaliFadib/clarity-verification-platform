import { Metadata } from "next";
import Link from "next/link";
import { PortfolioHeader } from "./components/portfolio-header";

export const metadata: Metadata = {
  title: "NexQA - Enterprise Portfolio",
  description: "Enterprise multi-project dashboard",
};

export default async function PortfolioPage() {
  // Show projects for all authenticated users
  const projects = [
    { id: "1", name: "NexQA Platform", status: "Active", quality_score: 85, metrics: { requirements: 25, test_cases: 150, defects: 12 } },
    { id: "2", name: "Mobile App", status: "Active", quality_score: 78, metrics: { requirements: 18, test_cases: 95, defects: 8 } },
    { id: "3", name: "API Gateway", status: "Planning", quality_score: 92, metrics: { requirements: 12, test_cases: 60, defects: 4 } },
  ];

  const totalProjects = projects.length;
  const qualityScore = 85;
  const atRiskCount = 0;
  const complianceScore = 75;

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

          {/* Create New Project Card */}
          <div className="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-4 min-h-[140px] hover:border-primary hover:bg-[#F0F7FF] transition-all duration-300 cursor-pointer text-outline hover:text-primary group">
            <span className="material-symbols-outlined text-[24px] mb-2 group-hover:scale-110 transition-transform duration-300">add_circle</span>
            <span className="font-bold text-body-md">Create New Project</span>
          </div>
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
