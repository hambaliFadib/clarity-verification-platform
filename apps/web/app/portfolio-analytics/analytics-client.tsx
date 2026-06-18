"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";

export function PortfolioAnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"day" | "week" | "month">("week");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/portfolio/analytics")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-xl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) return null;

  const mockDayData = [
    { label: "Mon", actual: 89, target: 95 },
    { label: "Tue", actual: 92, target: 95 },
    { label: "Wed", actual: 90, target: 95 },
    { label: "Thu", actual: 94, target: 95 },
    { label: "Fri", actual: 91, target: 95 },
    { label: "Sat", actual: 93, target: 95 },
    { label: "Sun", actual: 92.4, target: 95 }
  ];

  const mockMonthData = [
    { label: "Jan", actual: 85, target: 95 },
    { label: "Feb", actual: 88, target: 95 },
    { label: "Mar", actual: 87, target: 95 },
    { label: "Apr", actual: 90, target: 95 },
    { label: "May", actual: 92.4, target: 95 }
  ];

  const getChartData = () => {
    if (filter === "day") return mockDayData;
    if (filter === "month") return mockMonthData;
    // Map week to label for consistency
    return data.qualityScoreTrend.map((d: any) => ({ ...d, label: d.week }));
  };

  const getFilterLabel = () => {
    if (filter === "day") return { title: "Last 7 Days", subtitle: "May 24 - May 30, 2024" };
    if (filter === "week") return { title: "Last 4 Weeks", subtitle: "May 1 - May 30, 2024" };
    if (filter === "month") return { title: "Last 5 Months", subtitle: "Jan 1 - May 30, 2024" };
    return { title: "", subtitle: "" };
  };

  const filterLabels = getFilterLabel();

  return (
    <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-lg flex flex-col gap-lg pb-2xl">

      {/* Top Navigation */}
      <div className="flex justify-between items-center pb-md">
        <div className="flex flex-col gap-1">
          <Link href="/projects" className="inline-flex items-center gap-2 text-primary font-label-md hover:opacity-80 transition-opacity group mb-2">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back to Projects</span>
          </Link>
          <h1 className="font-headline-sm text-headline-sm text-primary">Portfolio Analytics</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Real-time health monitoring across {data.portfolioHealth.total} active enterprise QA workstreams.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-sm bg-surface border border-outline-variant rounded-lg px-4 py-2 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
            <div className="flex flex-col items-start text-left">
              <span className="font-label-md text-label-md text-on-surface">{filterLabels.title}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{filterLabels.subtitle}</span>
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant ml-2">
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg z-50 py-2">
              <button
                onClick={() => { setFilter("day"); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-label-md hover:bg-surface-container-low ${filter === 'day' ? 'text-primary font-bold' : 'text-on-surface'}`}
              >
                Hari (7 Hari Terakhir)
              </button>
              <button
                onClick={() => { setFilter("week"); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-label-md hover:bg-surface-container-low ${filter === 'week' ? 'text-primary font-bold' : 'text-on-surface'}`}
              >
                Minggu (4 Minggu Terakhir)
              </button>
              <button
                onClick={() => { setFilter("month"); setIsDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 text-label-md hover:bg-surface-container-low ${filter === 'month' ? 'text-primary font-bold' : 'text-on-surface'}`}
              >
                Bulan (5 Bulan Terakhir)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Quality Score Trend */}
      <div className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant p-lg">
        <div className="flex justify-between items-start mb-lg">
          <div className="flex flex-col">
            <h2 className="font-title-md text-title-md text-primary">Quality Score Trend</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Aggregate portfolio quality index over time</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary-fixed-dim"></div>
              <span className="font-label-sm text-on-surface-variant">Target (95%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-label-sm text-on-surface-variant">Actual Portfolio</span>
            </div>
          </div>
        </div>
        <div className="h-[250px] w-full bg-surface-container-lowest rounded-lg">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getChartData()} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#49454f', fontSize: 12}} dy={10} />
              <RechartsTooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #79747e', backgroundColor: '#fdf8fd' }}
                itemStyle={{ color: '#005AC1' }}
              />
              <Line type="monotone" dataKey="actual" stroke="#005AC1" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="target" stroke="#79747e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Defects vs Requirements & Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant p-lg flex flex-col">
          <h2 className="font-title-md text-title-md text-primary mb-lg">Defects vs. Requirements</h2>
          <div className="flex flex-col gap-md flex-1 justify-center">
            {data.defectsVsRequirements.map((item: any, idx: number) => {
              const maxReq = Math.max(...data.defectsVsRequirements.map((d: any) => d.requirements), 100);
              const defectWidth = Math.min((item.defects / maxReq) * 100, 100);
              const reqWidth = (item.requirements / maxReq) * 100;

              return (
                <div key={idx} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-body-md text-on-surface">{item.project}</span>
                    <span className="font-body-sm text-on-surface-variant">{item.defects} Defects / {item.requirements} Requirements</span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${defectWidth}%` }}></div>
                    <div className="h-full bg-error" style={{ width: `${reqWidth - defectWidth}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-lg">
          <div className="bg-primary rounded-xl shadow-md p-lg text-on-primary flex flex-col justify-between flex-1 min-h-[140px]">
            <span className="material-symbols-outlined text-[28px] mb-2 text-primary-fixed-dim">verified</span>
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-primary-fixed-dim">Overall Coverage</span>
              <span className="font-headline-lg font-bold text-on-primary">{data.overallCoverage}%</span>
              <span className="font-label-sm text-primary-fixed-dim">+{data.overallCoverageChange}% from last month</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant p-lg flex flex-col justify-between flex-1 min-h-[140px]">
            <span className="material-symbols-outlined text-[28px] mb-2 text-error">bug_report</span>
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-on-surface">Critical Vulnerabilities</span>
              <span className="font-headline-lg font-bold text-error">
                {String(data.criticalVulnerabilities).padStart(2, '0')}
              </span>
              <span className="font-label-sm text-on-surface-variant">Action required in {data.criticalVulnerabilitiesProjects} projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Portfolio Health & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Portfolio Health */}
        <div className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant p-lg flex flex-col">
          <h2 className="font-title-md text-title-md text-primary mb-md">Portfolio Health</h2>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: data.portfolioHealth.active, fill: '#005AC1' },
                      { name: 'Planning', value: data.portfolioHealth.planning, fill: '#60A5FA' },
                      { name: 'On Hold', value: data.portfolioHealth.onHold, fill: '#E5E7EB' }
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-[20px]">
              <span className="font-headline-sm font-bold text-on-surface">{data.portfolioHealth.total}</span>
              <span className="font-label-sm text-on-surface-variant">Projects</span>
            </div>

            {/* Legend */}
            <div className="w-full flex flex-col gap-2 mt-4">
              <div className="flex justify-between items-center text-body-sm">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> Active</div>
                <span className="font-bold">{data.portfolioHealth.active}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#60A5FA]"></div> Planning</div>
                <span className="font-bold">{data.portfolioHealth.planning}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#E5E7EB]"></div> On Hold</div>
                <span className="font-bold">{data.portfolioHealth.onHold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="lg:col-span-2 flex flex-col gap-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-subtle border border-outline-variant p-lg flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-md">
              <h2 className="font-title-md text-title-md text-primary">Risk Distribution</h2>
              <button className="text-primary text-label-md flex items-center hover:underline">
                View Risk Matrix <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
            <div className="flex-1 flex items-end gap-4 h-[150px] mb-4">
              {data.riskDistribution.map((item: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full bg-surface-container-low rounded-t-lg relative h-full flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg ${idx === 3 ? 'bg-[#3B82F6]' : 'bg-[#1E40AF]'}`}
                      style={{ height: `${item.risk}%` }}
                    ></div>
                  </div>
                  <span className="font-label-sm text-on-surface-variant">{item.quarter}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Alert */}
          {data.criticalAlert && (
            <div className="bg-surface-container-lowest border-l-4 border-l-error rounded-r-lg p-md flex flex-col gap-1 shadow-sm">
              <span className="font-label-bold text-error uppercase text-[12px] tracking-wider">Critical Alert</span>
              <span className="font-body-md text-on-surface">{data.criticalAlert.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button Placeholder (Download) */}
      <div className="fixed bottom-8 right-8 z-50">
        <Tooltip content="Coming soon" side="left">
          <button
            className="bg-primary/50 text-on-primary/70 w-14 h-14 rounded-full shadow-md flex items-center justify-center cursor-not-allowed"
            disabled
            onClick={(e) => e.preventDefault()}
          >
            <span className="material-symbols-outlined">download</span>
          </button>
        </Tooltip>
      </div>

    </div>
  );
}
