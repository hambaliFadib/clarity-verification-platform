"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { timeAgo, cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/types";

let globalActivities: ActivityItem[] = [];

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>(globalActivities);
  const [unreadCount, setUnreadCount] = useState(activities.length);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      const response = await fetch("/api/activity", { cache: "no-store" });
      if (!isMounted || !response.ok) return;

      let fetched = await response.json();
      const now = new Date().getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      globalActivities = fetched.filter((a: ActivityItem) => (now - new Date(a.timestamp).getTime()) < ONE_DAY);

      setActivities([...globalActivities]);

      const lastReadStr = localStorage.getItem("lastReadActivityTimestamp");
      if (lastReadStr) {
        const lastRead = new Date(lastReadStr).getTime();
        setUnreadCount(globalActivities.filter(a => new Date(a.timestamp).getTime() > lastRead).length);
      } else {
        setUnreadCount(globalActivities.length);
      }
    }

    loadActivities().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Refresh filter just in case time passed
      const now = new Date().getTime();
      const ONE_DAY = 24 * 60 * 60 * 1000;
      globalActivities = globalActivities.filter(a => (now - new Date(a.timestamp).getTime()) < ONE_DAY);
      setActivities([...globalActivities]);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = () => {
    localStorage.setItem("lastReadActivityTimestamp", new Date().toISOString());
    setUnreadCount(0);
  };

  useEffect(() => {
    const handleNewActivity: EventListener = (event) => {
      const newActivity = (event as CustomEvent<ActivityItem>).detail;
      globalActivities = [newActivity, ...globalActivities];
      setActivities([...globalActivities]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener("new-activity", handleNewActivity);
    return () => window.removeEventListener("new-activity", handleNewActivity);
  }, []);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 transition-colors rounded-full",
          isOpen ? "bg-surface-container-high" : "hover:bg-surface-container-high"
        )}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-on-surface-variant" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-float border border-outline-variant overflow-hidden z-[100] animate-fade-in-up origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface/80 backdrop-blur-sm">
            <h3 className="text-body-md font-semibold text-on-surface">Recent Activity</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-caption text-primary-container font-medium hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-body-sm">
                No recent activity.
              </div>
            ) : (
              activities.slice(0, 5).map((act, idx) => {
                const linkTarget = act.targetType === "defect" ? `/defects/${act.targetId}` : `/test-cases/${act.targetId}`;

                return (
                  <div key={act.id || idx} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-caption font-semibold text-primary">
                      {act.userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm text-on-surface">
                        <span className="font-semibold">{act.user}</span>{" "}
                        {act.action}{" "}
                        <Link href={linkTarget} onClick={() => setIsOpen(false)} className="text-primary-container font-medium hover:underline">
                          {act.targetId}
                        </Link>
                      </p>
                      {act.targetTitle && (
                        <p className="text-caption text-muted-foreground line-clamp-1">{act.targetTitle}</p>
                      )}
                      <p className="text-label-sm text-outline mt-0.5">{timeAgo(act.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-low text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("toggle-activity-sidebar"));
              }}
              className="text-body-md font-medium text-primary hover:underline"
            >
              View All Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
