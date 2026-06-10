import { teamMembers } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Trash2, Users, Mail } from "lucide-react";
import { roleBadgeVariants } from "@/lib/badge-variants";

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

export default function ProjectSettingsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="Project Settings"
        subtitle="Configure your project preferences"
      />

      {/* General Settings */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5">
        <h2 className="text-headline-sm font-headline font-semibold text-on-surface">General</h2>

        <div>
          <label className={labelClass}>Project Name</label>
          <input className={inputClass} defaultValue="Clarity Platform" />
        </div>

        <div>
          <label className={labelClass}>Project Key / Prefix</label>
          <input className={inputClass} defaultValue="CLR" />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            defaultValue="QA project management platform focused on clarity across test case management, test execution, defect management, and release readiness."
          />
        </div>

        <div>
          <label className={labelClass}>Default Priority</label>
          <select className={inputClass} defaultValue="Medium">
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="flex justify-end">
          <Button>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5">
        <div className="flex justify-between items-center">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Members
          </h2>
          <Button variant="secondary" size="sm">
            <Mail className="h-3.5 w-3.5" /> Invite Member
          </Button>
        </div>

        <div className="divide-y divide-outline-variant/50">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs">
                  {member.initials}
                </div>
                <div>
                  <p className="text-body-md font-medium text-on-surface">
                    {member.name}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {member.email}
                  </p>
                </div>
              </div>
              <Badge variant={roleBadgeVariants[member.role]}>
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-error/30 rounded-xl p-6 space-y-4">
        <h2 className="text-headline-sm font-headline font-semibold text-error">
          Danger Zone
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="text-error border-error/30 hover:bg-error/5 hover:text-error">
            Archive Project
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4" /> Delete Project
          </Button>
        </div>
      </div>
    </div>
  );
}
