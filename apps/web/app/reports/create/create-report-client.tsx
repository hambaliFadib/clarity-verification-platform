"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateReportClient() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState("Last 7 Days");
  const [outputFormat, setOutputFormat] = useState("PDF");

  const handleGenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    // Simulate generation and go back to reports list
    router.push("/reports");
  };

  return (
    <div className="w-full flex flex-col h-screen overflow-hidden bg-surface-container-lowest">

      {/* Top Header matching the design */}
      <header className="flex justify-between items-center w-full bg-surface/90 backdrop-blur-md border-b border-outline-variant h-16 px-margin-mobile md:px-margin-desktop sticky top-0 z-50">
        <Link href="/reports" className="flex items-center gap-2 text-primary font-label-md hover:opacity-80 transition-opacity group">
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span className="font-bold">Back to Reports</span>
        </Link>
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
          Generate New Report
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto flex justify-center py-xl bg-[#F8FAFC]">
        <div className="w-full max-w-[800px] px-margin-mobile">

          <div className="bg-white rounded-2xl border border-outline-variant shadow-subtle p-6 md:p-10 flex flex-col gap-10">

            {/* 1. Report Details */}
            <section className="flex flex-col gap-5">
              <h2 className="font-headline-sm text-[20px] text-primary font-bold">1. Report Details</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-bold text-on-surface-variant flex gap-1">
                    Report Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 QA Performance Overview"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-bold text-on-surface-variant flex gap-1">
                    Report Type <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer">
                      <option value="">Select type...</option>
                      <option value="quality">Quality Audit</option>
                      <option value="coverage">Test Coverage</option>
                      <option value="compliance">Compliance Status</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Data Configuration */}
            <section className="flex flex-col gap-5">
              <h2 className="font-headline-sm text-[20px] text-primary font-bold">2. Data Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-bold text-on-surface-variant flex gap-1">
                    Select Project(s) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer">
                      <option value="all">All Active Projects</option>
                      <option value="p1">Project Alpha</option>
                      <option value="p2">Project Beta</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label-sm font-bold text-on-surface-variant">
                    Select Environment
                  </label>
                  <div className="relative">
                    <select className="w-full appearance-none bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow cursor-pointer">
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                      <option value="qa">QA</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Timeframe */}
            <section className="flex flex-col gap-5">
              <h2 className="font-headline-sm text-[20px] text-primary font-bold">3. Timeframe</h2>
              <div className="flex flex-col gap-4">
                <label className="text-label-sm text-on-surface-variant hidden">Select Range</label>

                {/* Timeframe Buttons */}
                <div className="flex flex-wrap gap-3">
                  {["Last 7 Days", "Last 30 Days", "This Quarter", "Custom Range"].map((range) => {
                    const isActive = timeframe === range;
                    return (
                      <button
                        key={range}
                        onClick={() => setTimeframe(range)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border font-medium text-body-sm transition-colors ${
                          isActive
                            ? 'bg-[#1e467d] border-[#1e467d] text-white shadow-sm'
                            : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container-lowest'
                        }`}
                      >
                        {range === "Custom Range" && <span className="material-symbols-outlined text-[18px]">calendar_today</span>}
                        {range}
                      </button>
                    );
                  })}
                </div>

                {/* Date Inputs (Below Buttons) */}
                {timeframe === "Custom Range" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 animate-fade-in w-full md:w-[80%] lg:w-[60%]">
                    <div className="flex flex-col gap-2">
                      <label className="text-label-sm text-on-surface-variant">Start Date</label>
                      <input
                        type="date"
                        className="bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer w-full"
                        aria-label="Start date"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-label-sm text-on-surface-variant">End Date</label>
                      <input
                        type="date"
                        className="bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer w-full"
                        aria-label="End date"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 4. Output Settings */}
            <section className="flex flex-col gap-5">
              <h2 className="font-headline-sm text-[20px] text-primary font-bold">4. Output Settings</h2>
              <div className="flex flex-col gap-2">
                <label className="text-label-sm text-on-surface-variant">Output Format</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: "PDF", icon: "picture_as_pdf" },
                    { id: "CSV", icon: "csv" },
                    { id: "XLSX", icon: "table_chart" }
                  ].map((format) => {
                    const isActive = outputFormat === format.id;
                    return (
                      <button
                        key={format.id}
                        onClick={() => setOutputFormat(format.id)}
                        className={`flex flex-col items-center justify-center gap-3 py-6 rounded-xl border-2 transition-all ${
                          isActive
                            ? 'bg-[#f4f8fc] border-[#c0d4ed] text-primary'
                            : 'bg-white border-outline-variant text-on-surface-variant hover:border-[#c0d4ed]'
                        }`}
                      >
                        {format.id === 'CSV' ? (
                          <div className="font-bold border-2 border-current px-1 rounded text-xs flex items-center justify-center">CSV</div>
                        ) : (
                          <span className="material-symbols-outlined text-[28px]">{format.icon}</span>
                        )}
                        <span className="font-bold text-on-surface">{format.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Footer Buttons */}
            <div className="flex justify-end items-center gap-3 pt-6 mt-2 border-t border-outline-variant/50">
              <Link href="/reports">
                <Button variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>
              <Button onClick={handleGenerate} size="md">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                Generate Report
              </Button>
            </div>

          </div>
        </div>
      </main>

    </div>
  );
}
