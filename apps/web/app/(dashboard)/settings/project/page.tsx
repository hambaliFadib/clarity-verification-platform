"use client";
import { useState } from "react";
import { teamMembers } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Save, Trash2, Users, Mail, Plus, Folder, Check } from "lucide-react";
import { roleBadgeVariants } from "@/lib/badge-variants";

interface Project {
  id: string;
  name: string;
  prefix: string;
  description: string;
  priority: string;
}

const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Clarity Platform",
    prefix: "CLR",
    description: "QA project management platform focused on clarity across test case management, test execution, defect management, and release readiness.",
    priority: "Medium"
  },
  {
    id: "p2",
    name: "NexQA Mobile App",
    prefix: "NXM",
    description: "Testing suite for the iOS and Android NexQA companion applications.",
    priority: "High"
  },
];

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

export default function ProjectSettingsPage() {
  const [projects] = useState<Project[]>(mockProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>("p1");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const [formData, setFormData] = useState<Project>(activeProject);
  const [isSaved, setIsSaved] = useState(false);

  const handleSwitchProject = (id: string) => {
    setActiveProjectId(id);
    setFormData(projects.find(p => p.id === id) || projects[0]);
    setIsProjectDropdownOpen(false);
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl pb-12">
      <PageHeader
        title="Project Settings"
        subtitle="Configure your project preferences"
      />

      {/* Project Switcher */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-body-lg font-semibold text-on-surface flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" /> Active Project
          </h2>
          <p className="text-body-sm text-on-surface-variant">Switch projects to edit their specific configurations.</p>
        </div>
        <div className="flex gap-2 relative w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2 text-left flex items-center justify-between hover:border-primary-container transition-colors"
            >
              <span className="text-body-md font-medium text-on-surface truncate">{activeProject.name}</span>
            </button>
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-elevated border border-outline-variant z-10 py-1 overflow-hidden">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchProject(p.id)}
                    className="w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container-low transition-colors flex items-center justify-between"
                  >
                    <span className="truncate">{p.name}</span>
                    {activeProjectId === p.id && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Tooltip content="Coming soon">
            <div>
              <Button variant="outline" disabled className="w-full sm:w-auto opacity-50">
                <Plus className="h-4 w-4" /> New Project
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5">
        <h2 className="text-headline-sm font-headline font-semibold text-on-surface">General Information</h2>

        <div>
          <label className={labelClass}>Project Name</label>
          <input
            className={inputClass}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className={labelClass}>Project Key / Prefix</label>
          <input
            className={inputClass}
            value={formData.prefix}
            onChange={(e) => setFormData({...formData, prefix: e.target.value})}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} min-h-[100px] resize-y`}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className={labelClass}>Default Priority</label>
          <select
            className={inputClass}
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
          >
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex justify-end items-center gap-3">
          {isSaved && <span className="text-body-sm text-emerald-600 font-medium animate-fade-in flex items-center gap-1"><Check className="h-4 w-4" /> Saved successfully</span>}
          <Button onClick={handleSave}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="bg-white px-4 py-2 text-body-md shadow-subtle uppercase tracking-normal font-bold text-on-surface-variant">Coming Soon</Badge>
        </div>

        <div className="opacity-60 pointer-events-none">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-headline-sm font-headline font-semibold text-on-surface flex items-center gap-2">
              <Users className="h-5 w-5" /> Team Members
            </h2>
            <Button variant="secondary" size="sm" disabled>
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
      </div>

      {/* Danger Zone */}
      <div className="bg-white border border-error/30 rounded-xl p-6 space-y-4">
        <h2 className="text-headline-sm font-headline font-semibold text-error">
          Danger Zone
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          These actions are irreversible. Please proceed with caution.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Tooltip content="Coming soon">
            <div>
              <Button variant="outline" disabled className="w-full text-error border-error/30 hover:bg-error/5 hover:text-error opacity-50">
                Archive Project
              </Button>
            </div>
          </Tooltip>
          <Tooltip content="Coming soon">
            <div>
              <Button variant="destructive" disabled className="w-full opacity-50">
                <Trash2 className="h-4 w-4" /> Delete Project
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
