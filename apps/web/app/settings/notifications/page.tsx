"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Bell } from "lucide-react";

export default function PlatformNotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Notifications"
        subtitle="Configure your platform-wide email and in-app notification preferences."
      />
      <div className="bg-white border border-outline-variant rounded-xl p-8 flex items-center justify-center min-h-[400px] shadow-sm">
        <div className="text-center">
          <Bell className="h-12 w-12 text-outline-variant mx-auto mb-4" />
          <h2 className="text-headline-sm font-bold text-primary mb-2">Notifications</h2>
          <p className="text-body-md text-on-surface-variant">This section is currently under construction.</p>
        </div>
      </div>
    </div>
  );
}
