"use client";
import { useEffect, useState } from "react";
import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";
import type { ReactNode } from "react";
import { ActivitySidebar } from "./activity-sidebar";
import type { Project } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActiveProject() {
      const response = await fetch("/api/projects?limit=1", { cache: "no-store" });
      if (!response.ok || !isMounted) return;
      const projects: Project[] = await response.json();
      setActiveProject(projects[0] || null);
    }

    const handleProjectUpdated = (event: Event) => {
      setActiveProject((event as CustomEvent<Project>).detail);
    };

    loadActiveProject().catch(() => undefined);
    window.addEventListener("clarity:project-updated", handleProjectUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener("clarity:project-updated", handleProjectUpdated);
    };
  }, []);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <SideNav
        isMobileOpen={isMobileOpen}
        isDesktopOpen={isDesktopOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleDesktop={() => setIsDesktopOpen(!isDesktopOpen)}
        projectName={activeProject?.name}
        projectSuffix={activeProject?.prefix}
      />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopNav
          isDesktopOpen={isDesktopOpen}
          onMenuClick={() => setIsMobileOpen(true)}
          onToggleDesktop={() => setIsDesktopOpen(!isDesktopOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <ActivitySidebar />
      </div>
    </div>
  );
}
