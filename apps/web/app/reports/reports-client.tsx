"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

const INITIAL_REPORTS = [
  {
    title: "Monthly Quality Audit - Q3 2023",
    project: "Project: Alpha System Expansion",
    type: "PDF",
    date: "Oct 12, 2023",
    author: { name: "Sarah Jenkins", initials: "SJ" },
    icon: "description"
  },
  {
    title: "Resource Allocation Summary",
    project: "Global Operations Portfolio",
    type: "CSV",
    date: "Oct 10, 2023",
    author: { name: "Michael Chen", initials: "MC" },
    icon: "table_chart"
  },
  {
    title: "Compliance Status Report - v2",
    project: "Regulatory Alignment 2023",
    type: "PDF",
    date: "Oct 08, 2023",
    author: { name: "Elena Rodriguez", initials: "ER" },
    icon: "verified_user"
  },
  {
    title: "Defect Trend Analysis - August",
    project: "Mobile App Replatforming",
    type: "PDF",
    date: "Sep 01, 2023",
    author: { name: "David Kim", initials: "DK" },
    icon: "trending_up"
  },
  {
    title: "Weekly Test Coverage - Sprint 42",
    project: "API Gateway Microservices",
    type: "CSV",
    date: "Aug 28, 2023",
    author: { name: "Lisa Wong", initials: "LW" },
    icon: "checklist"
  }
];

const MORE_REPORTS_POOL = [
  { title: "Security Vulnerability Scan", project: "Payment Gateway", type: "PDF", author: { name: "James Smith", initials: "JS" }, icon: "security" },
  { title: "Performance Load Test Results", project: "E-Commerce Frontend", type: "CSV", author: { name: "Anna Lee", initials: "AL" }, icon: "speed" },
  { title: "UAT Sign-off Document", project: "HR Portal V2", type: "PDF", author: { name: "Tom Hardy", initials: "TH" }, icon: "assignment_turned_in" },
  { title: "Accessibility Compliance Audit", project: "Public Website", type: "PDF", author: { name: "Sarah Jenkins", initials: "SJ" }, icon: "accessibility" },
  { title: "Sprint 41 Retrospective Data", project: "Mobile App Replatforming", type: "CSV", author: { name: "David Kim", initials: "DK" }, icon: "history" }
];

export function ReportsClient() {
  const [reports, setReports] = useState(INITIAL_REPORTS.map((r, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (i * 15)); // Spread dates across recent months
    return { ...r, id: `initial-${i}`, date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) };
  }));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("All Types");
  const [filterDate, setFilterDate] = useState("Last 30 Days");
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreReports();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, hasMore, loadingMore, reports]);

  const loadMoreReports = () => {
    setLoadingMore(true);
    // Simulate network delay
    setTimeout(() => {
      if (reports.length >= 10) {
        setHasMore(false); // Stop exactly at 10 items
        setLoadingMore(false);
        return;
      }

      const newItems = MORE_REPORTS_POOL.map((r, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 70 - (i * 20)); // Older dates
        return {
          ...r,
          id: `loaded-${reports.length}-${i}`,
          date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
        };
      });

      setReports(prev => [...prev, ...newItems]);
      if (reports.length + newItems.length >= 10) {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 1200);
  };

  const filteredReports = reports.filter(r => {
    if (filterType !== "All Types" && r.type !== filterType) return false;

    const rDate = new Date(r.date);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - rDate.getTime()) / (1000 * 60 * 60 * 24));

    if (filterDate === "Last 30 Days" && diffDays > 30) return false;
    if (filterDate === "Last 3 Months" && diffDays > 90) return false;
    if (filterDate === "Last 6 Months" && diffDays > 180) return false;

    return true;
  });

  return (
    <main className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop py-xl flex flex-col gap-lg pb-2xl">

      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <Link href="/projects" className="inline-flex items-center gap-2 text-primary font-label-md hover:opacity-80 transition-opacity group mb-2">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Projects</span>
        </Link>
        <h1 className="font-headline-sm text-headline-sm md:font-headline-md md:text-headline-md text-on-surface">
          Enterprise Reports Management
        </h1>
      </div>

      {/* Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-subtle">
        <div className="flex items-center gap-4">
          <span className="text-body-md text-on-surface-variant font-medium">Filter by:</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="appearance-none bg-surface-container border border-outline-variant pl-3 pr-8 py-1.5 rounded-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All Types">All Types</option>
                <option value="PDF">PDF Only</option>
                <option value="CSV">CSV Only</option>
              </select>
              <span className="material-symbols-outlined text-[18px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
            <div className="relative">
              <select
                className="appearance-none bg-surface-container border border-outline-variant pl-3 pr-8 py-1.5 rounded-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/50"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="All Time">All Time</option>
              </select>
              <span className="material-symbols-outlined text-[18px] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>
          </div>
        </div>
        <Link href="/reports/create" className="w-full sm:w-auto">
          <button className="bg-primary hover:bg-primary-hover text-on-primary px-4 py-2 rounded-md font-label-md shadow-sm transition-colors w-full text-center">
            Generate New Report
          </button>
        </Link>
      </div>

      {/* Table Area */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-subtle overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-4 font-label-lg text-on-surface-variant whitespace-nowrap">Title</th>
                <th className="p-4 font-label-lg text-on-surface-variant whitespace-nowrap">Type</th>
                <th className="p-4 font-label-lg text-on-surface-variant whitespace-nowrap">Generated Date</th>
                <th className="p-4 font-label-lg text-on-surface-variant whitespace-nowrap">Author</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-outline-variant hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-surface-container rounded-lg text-primary group-hover:bg-primary/10 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">{report.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-md text-on-surface group-hover:text-primary transition-colors cursor-pointer">{report.title}</span>
                        <span className="font-body-sm text-on-surface-variant">{report.project}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider ${
                      report.type === 'PDF'
                        ? 'bg-[#FFEBEE] text-[#C62828]'
                        : 'bg-[#E3F2FD] text-[#1565C0]'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-body-md text-on-surface-variant">{report.date}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
                        {report.author.initials}
                      </div>
                      <span className="font-body-md text-on-surface">{report.author.name}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sentinel Element for Infinite Scrolling */}
        {hasMore && (
          <div ref={observerTarget} className="p-6 flex items-center justify-center bg-surface-container-lowest">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-outline">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-label-md">Loading older reports...</span>
              </div>
            ) : (
              <span className="font-label-md text-outline">Scroll to load more</span>
            )}
          </div>
        )}

        {!hasMore && (
          <div className="p-6 flex items-center justify-center bg-surface-container-lowest">
            <span className="font-label-md text-outline">No more reports to show</span>
          </div>
        )}
      </div>

    </main>
  );
}
