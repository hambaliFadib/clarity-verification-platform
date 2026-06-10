import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-surface-bright via-[#f0f4ff] to-surface-container-low">
          {children}
        </main>
      </div>
    </div>
  );
}
