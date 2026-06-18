"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, X, ArrowLeft } from "lucide-react";
import { navGroups, settingsGroup } from "@/components/layout/navigation-config";
import type { NavItemConfig } from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface SideNavProps {
  isMobileOpen?: boolean;
  isDesktopOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleDesktop?: () => void;
  projectName?: string;
  projectSuffix?: string;
}

export function SideNav({ isMobileOpen, isDesktopOpen, onCloseMobile, onToggleDesktop, projectName, projectSuffix }: SideNavProps) {
  const pathname = usePathname();
  const workspaceTitle = projectName?.trim() || "Clarity Platform";
  const workspaceSubtitle = projectSuffix?.trim() || "QA Workspace";

  const isActive = (href: string) => {
    if (href === "/my-work") return pathname === "/my-work";
    if (href === "/settings") return pathname === "/settings";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItemConfig) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <Tooltip key={item.label} content="Coming soon" side="right">
          <div className="flex items-center gap-3 py-2 px-4 mx-2 rounded-md opacity-40 cursor-not-allowed select-none h-10">
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-body-md font-medium whitespace-nowrap">{item.label}</span>
          </div>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={onCloseMobile}
        className={cn(
          "flex items-center gap-3 py-2 px-4 mx-2 rounded-md transition-all duration-150 h-10",
          active
            ? "bg-primary-container text-white font-semibold border-l-[3px] border-white/50 shadow-subtle"
            : "text-on-surface-variant hover:bg-surface-container-low"
        )}
      >
        <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
        <span className="text-body-md font-medium whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-surface-container-highest/50 backdrop-blur-sm z-[60] md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] transition-all duration-300 ease-in-out flex flex-col bg-surface/95 md:bg-surface/80 backdrop-blur-md border-r border-outline-variant h-full flex-shrink-0 overflow-hidden",
          isMobileOpen ? "translate-x-0 w-sidebar-width" : "-translate-x-full w-sidebar-width",
          "md:static md:translate-x-0",
          isDesktopOpen ? "md:w-sidebar-width md:flex" : "md:w-0 md:border-r-0 md:opacity-0"
        )}
      >
        <Link
          href="/projects"
          className="px-4 h-header-height flex items-center justify-between gap-3 cursor-pointer group hover:bg-surface-container-low/50 transition-colors flex-shrink-0"
          onClick={onCloseMobile}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-7 w-7 flex-shrink-0">
              <Hexagon className="absolute inset-0 h-7 w-7 text-primary transition-all duration-300 group-hover:scale-50 group-hover:opacity-0" />
              <ArrowLeft className="absolute inset-0 h-7 w-7 text-primary transition-all duration-300 scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100" />
            </div>
            <div className="flex-1 min-w-0 whitespace-nowrap">
              <div className="group-hover:hidden transition-all duration-300">
                <p className="text-body-md font-semibold text-on-surface truncate">{workspaceTitle}</p>
                <p className="text-caption text-outline truncate">{workspaceSubtitle}</p>
              </div>
              <div className="hidden group-hover:block transition-all duration-300">
                <p className="text-body-md font-bold text-primary translate-y-[2px]">Back to Projects</p>
              </div>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={(e) => { e.stopPropagation(); onCloseMobile(); }}
              className="md:hidden p-1.5 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Link>

        <nav className="flex-1 overflow-y-auto py-2 space-y-1">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-2">
              <div className="px-6 py-2 text-label-sm font-semibold text-outline uppercase tracking-wide">
                {group.title}
              </div>
              {group.items.map(renderNavItem)}
            </div>
          ))}
        </nav>

        <div className="border-t border-outline-variant p-2 space-y-1 pb-4">
          <div className="px-4 py-2 text-label-sm font-semibold text-outline uppercase tracking-wide">
            {settingsGroup.title}
          </div>
          {settingsGroup.items.map(renderNavItem)}
        </div>
      </aside>
    </>
  );
}
