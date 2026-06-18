"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, Bell, Plug } from "lucide-react";
import { TopNav } from "@/components/layout/top-nav";

const platformTabs = [
  { name: "General", icon: Settings, href: "/settings/general" },
  { name: "Users", icon: Users, href: "/settings/users" },
  { name: "Notifications", icon: Bell, href: "/settings/notifications" },
  { name: "Integrations", icon: Plug, href: "/settings/integrations" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-outline-variant p-4 flex flex-col flex-shrink-0">
          <Link href="/projects" className="flex items-center gap-2 mb-6 px-2 group">
            <Settings className="h-5 w-5 text-primary group-hover:animate-spin transition-all duration-300" />
            <span className="font-semibold text-on-surface">
              <span className="group-hover:hidden">Platform Settings</span>
              <span className="hidden group-hover:inline">Back to Projects</span>
            </span>
          </Link>
          <nav className="space-y-1 flex-1">
            {platformTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>

        </aside>
        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <TopNav />
          <main className="flex-1 overflow-y-auto bg-surface">
            <div className="max-w-[1440px] mx-auto p-6 w-full">
              {children}
            </div>
          </main>
        </div>
    </div>
  );
}
