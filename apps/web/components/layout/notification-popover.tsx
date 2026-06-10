"use client";
import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { activityFeed } from "@/lib/mock-data";
import { timeAgo, cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/types";

let globalActivities = [...activityFeed];

export function NotificationPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>(globalActivities);
  const [unreadCount, setUnreadCount] = useState(activities.length);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
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
    setUnreadCount(0);
    setIsOpen(false);
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
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-float border border-outline-variant overflow-hidden z-[100] animate-fade-in-up origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface/80 backdrop-blur-sm">
            <h3 className="text-label-bold font-label-bold text-on-surface">Recent Activity</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary-container font-medium hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant text-body-sm">
                No recent activity.
              </div>
            ) : (
              activities.map((act, idx) => (
                <div key={act.id || idx} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">
                    {act.userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm text-on-surface">
                      <span className="font-bold">{act.user}</span>{" "}
                      {act.action}{" "}
                      <span className="text-primary-container font-medium">{act.targetId}</span>
                    </p>
                    {act.targetTitle && (
                      <p className="text-[11px] text-on-surface-variant line-clamp-1">{act.targetTitle}</p>
                    )}
                    <p className="text-[10px] text-outline mt-0.5">{timeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-low text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("toggle-activity-sidebar"));
              }}
              className="text-label-bold font-label-bold text-primary hover:underline"
            >
              View All Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
