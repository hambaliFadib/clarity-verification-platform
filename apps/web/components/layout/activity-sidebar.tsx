"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { ActivityItem } from "@/lib/types";

let globalActivities: ActivityItem[] = [];

export function ActivitySidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>(globalActivities);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      const response = await fetch("/api/activity", { cache: "no-store" });
      if (!isMounted || !response.ok) return;
      globalActivities = await response.json();
      setActivities([...globalActivities]);
    }

    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    const handleNewActivity: EventListener = (event) => {
      const activity = (event as CustomEvent<ActivityItem>).detail;
      globalActivities = [activity, ...globalActivities];
      setActivities([...globalActivities]);
    };

    window.addEventListener("toggle-activity-sidebar", handleToggle);
    window.addEventListener("close-activity-sidebar", handleClose);
    window.addEventListener("new-activity", handleNewActivity);
    loadActivities().catch(() => undefined);

    return () => {
      isMounted = false;
      window.removeEventListener("toggle-activity-sidebar", handleToggle);
      window.removeEventListener("close-activity-sidebar", handleClose);
      window.removeEventListener("new-activity", handleNewActivity);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-surface-container-highest/20 backdrop-blur-sm z-[90] xl:hidden"
        onClick={() => setIsOpen(false)}
      />
      <aside className="fixed right-0 top-0 h-screen w-80 bg-card border-l border-outline-variant shadow-elevated z-[100] flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 h-header-height border-b border-outline-variant bg-surface/80 backdrop-blur-sm flex-shrink-0">
          <h2 className="text-headline-sm font-semibold text-on-surface">All Activity</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activities.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-body-sm">
              No activity recorded.
            </div>
          ) : (
            activities.map((act, idx) => {
              const linkTarget = act.targetType === "defect" ? `/defects/${act.targetId}` : `/test-cases/${act.targetId}`;

              return (
                <div key={act.id || idx} className="flex gap-3 group">
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
                      <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5 group-hover:text-on-surface transition-colors">
                        {act.targetTitle}
                      </p>
                    )}
                    {act.detail && (
                      <p className="text-caption text-muted-foreground italic mt-1 border-l-2 border-outline-variant/50 pl-2">
                        {act.detail}
                      </p>
                    )}
                    <p className="text-label-sm text-outline mt-1.5 font-medium">{timeAgo(act.timestamp)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
