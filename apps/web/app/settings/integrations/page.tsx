"use client";
import { PageHeader } from "@/components/layout/page-header";
import { Plug } from "lucide-react";

export default function PlatformIntegrationsPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Integrations & API Keys"
        subtitle="Manage API keys and third-party tool integrations."
      />
      <div className="bg-white border border-outline-variant rounded-xl p-8 flex items-center justify-center min-h-[400px] shadow-sm">
        <div className="text-center">
          <Plug className="h-12 w-12 text-outline-variant mx-auto mb-4" />
          <h2 className="text-headline-sm font-bold text-primary mb-2">Integrations</h2>
          <p className="text-body-md text-on-surface-variant">This section is currently under construction.</p>
        </div>
      </div>
    </div>
  );
}
