import { environments } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  environmentStatusBadgeVariants,
  environmentTypeBadgeVariants,
} from "@/lib/badge-variants";

export default function EnvironmentsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Environments"
        subtitle="Manage your deployment environments"
        actions={<Button><Plus className="h-4 w-4" /> Add Environment</Button>}
      />
      <div className="space-y-3">
        {environments.map((env) => (
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
  );
}
