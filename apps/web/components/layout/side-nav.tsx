"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon } from "lucide-react";
import { navGroups, settingsGroup } from "@/components/layout/navigation-config";
import type { NavItemConfig } from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/my-work") return pathname === "/my-work";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItemConfig) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <Tooltip key={item.label} content="Coming soon" side="right">
          <div className="flex items-center gap-3 py-2 px-4 mx-2 rounded-lg opacity-40 cursor-not-allowed select-none">
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-label-bold font-label-bold">{item.label}</span>
          </div>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "flex items-center gap-3 py-2 px-4 mx-2 rounded-lg transition-all duration-150",
          active
            ? "bg-primary-container text-white font-bold border-l-[3px] border-white/50 shadow-subtle"
            : "text-on-surface-variant hover:bg-surface-container-low"
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.5 : 2} />
        <span className="text-label-bold font-label-bold">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-sidebar-width flex flex-col bg-surface/80 backdrop-blur-sm border-r border-outline-variant h-full flex-shrink-0">
      <div className="px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-container to-primary flex items-center justify-center shadow-subtle">
          <Hexagon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label-bold font-label-bold text-on-surface truncate">Clarity Platform</p>
          <p className="text-[11px] text-outline truncate">QA Workspace</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-1">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-2">
            <div className="px-6 py-2 text-[10px] font-bold text-outline uppercase tracking-normal">
              {group.title.toUpperCase()}
            </div>
            {group.items.map(renderNavItem)}
          </div>
        ))}
      </nav>

      <div className="border-t border-outline-variant p-2 space-y-1">
        <div className="px-4 py-2 text-[10px] font-bold text-outline uppercase tracking-normal">
          {settingsGroup.title.toUpperCase()}
        </div>
        {settingsGroup.items.map(renderNavItem)}
      </div>
    </aside>
  );
}
