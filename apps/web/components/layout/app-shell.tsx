"use client";
import { useState } from "react";
import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";
import type { ReactNode } from "react";
import { ActivitySidebar } from "./activity-sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <SideNav
        isMobileOpen={isMobileOpen}
        isDesktopOpen={isDesktopOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onToggleDesktop={() => setIsDesktopOpen(!isDesktopOpen)}
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
