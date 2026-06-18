"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Environment } from "@/lib/types";
import { AddEnvironmentModal } from "@/components/settings/add-environment-modal";
import {
  environmentStatusBadgeVariants,
  environmentTypeBadgeVariants,
} from "@/lib/badge-variants";

export default function EnvironmentsPage() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEnvironments() {
      const response = await fetch("/api/environments", { cache: "no-store" });
      if (isMounted && response.ok) setEnvironments(await response.json());
    }

    loadEnvironments().catch(() => {
      if (isMounted) setEnvironments([]);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddEnvironment = async (env: Environment) => {
    const response = await fetch("/api/environments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(env),
    });
    if (!response.ok) return;

    const result = await response.json();
    setEnvironments([...environments, result.environment]);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in relative z-0">
        <PageHeader
          title="Environments"
          subtitle="Manage your deployment environments"
          actions={<Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4" /> Add Environment</Button>}
        />
        <div className="space-y-3">
          {environments.length === 0 ? (
            <div className="bg-white border border-outline-variant rounded-xl p-8 text-center text-body-md text-on-surface-variant">
              No environments configured.
            </div>
          ) : environments.map((env) => (
            <div key={env.id} className="bg-white border border-outline-variant rounded-xl p-5 hover:shadow-card transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-body-lg font-semibold text-on-surface">{env.name}</h3>
                    <Badge variant={environmentTypeBadgeVariants[env.type]}>{env.type}</Badge>
                    <Badge variant={environmentStatusBadgeVariants[env.status]}>{env.status}</Badge>
                  </div>
                  <a href={env.url} target="_blank" rel="noopener noreferrer" className="text-body-sm text-primary-container hover:underline inline-flex items-center gap-1">
                    {env.url} <ExternalLink className="h-3 w-3" />
                  </a>
                  {env.description && <p className="text-body-sm text-on-surface-variant">{env.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  {env.version && <div className="font-mono text-code text-on-surface-variant">{env.version}</div>}
                  {env.lastDeployed && <div className="text-[11px] text-outline mt-1">Deployed {formatDate(env.lastDeployed)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddEnvironmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEnvironment}
      />
    </>
  );
}
