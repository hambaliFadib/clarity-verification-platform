import { FocusCard } from "@/components/focus-card";

const focusAreas = [
  {
    title: "Test Cases",
    description: "Author, review, organize, and trace quality coverage."
  },
  {
    title: "Test Runs",
    description: "Prepare execution cycles and capture run outcomes."
  },
  {
    title: "Defects",
    description: "Report, triage, and track bugs from test evidence."
  },
  {
    title: "Release Readiness",
    description: "Build the foundation for quality signals before release."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-surface px-6 py-10 text-ink">
      <section className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-accent">
            Phase 1 Repository Foundation
          </p>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">NexQA</h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Clarity Platform for QA Project Management.
            </p>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Phase 1 focus areas">
          {focusAreas.map((area) => (
            <FocusCard key={area.title} title={area.title} description={area.description} />
          ))}
        </section>
      </section>
    </main>
  );
}
