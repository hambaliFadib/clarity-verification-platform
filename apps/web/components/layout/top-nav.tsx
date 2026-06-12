"use client";
import { HelpCircle, Menu } from "lucide-react";
import { NotificationPopover } from "./notification-popover";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface TopNavProps {
  onMenuClick?: () => void;
  onToggleDesktop?: () => void;
  isDesktopOpen?: boolean;
}

export function TopNav({ onMenuClick, onToggleDesktop, isDesktopOpen = true }: TopNavProps) {
  const { data: session } = useSession();

  const currentUser = {
    name: session?.user?.name || "Project User",
    role: session?.user?.role || "Viewer",
    initials: session?.user?.initials || "PU",
    avatar: session?.user?.image,
  };

  return (
    <header className="flex justify-between items-center h-14 px-gutter w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant transition-all duration-300">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {!isDesktopOpen && onToggleDesktop && (
          <button
            onClick={onToggleDesktop}
            className="hidden md:block p-2 -ml-2 text-on-surface hover:bg-surface-container-low rounded-full transition-colors animate-fade-in"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="text-headline-sm font-headline font-bold text-on-surface">
          NexQA
        </span>
      </div>

      <div className="flex items-center gap-2">
        <NotificationPopover />
        <button
          className="p-2 hover:bg-surface-container-high transition-colors rounded-full hidden sm:block"
          aria-label="Help"
        >
          <HelpCircle className="h-[18px] w-[18px] text-on-surface-variant" />
        </button>

        <Link href="/account" className="flex items-center gap-3 pl-3 ml-1 border-l border-outline-variant hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-label-bold font-label-bold text-on-surface leading-tight">
              {currentUser.name}
            </p>
            <span className="text-[9px] bg-gradient-to-r from-primary-container to-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-normal">
              {currentUser.role}
            </span>
          </div>
          {currentUser.avatar ? (
            <Image src={currentUser.avatar} alt={currentUser.name} width={36} height={36} className="rounded-full border-2 border-white shadow-subtle" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs border-2 border-white shadow-subtle">
              {currentUser.initials}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
