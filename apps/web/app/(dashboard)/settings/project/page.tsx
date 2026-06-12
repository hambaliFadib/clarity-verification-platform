"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, Users, Mail, Plus, Folder, Check } from "lucide-react";
import { roleBadgeVariants } from "@/lib/badge-variants";
import type { Project, TeamMember } from "@/lib/types";

const emptyProject: Project = {
  id: "",
  name: "",
  prefix: "",
  description: "",
  priority: "Medium",
};

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2.5 text-body-md bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

export default function ProjectSettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [formData, setFormData] = useState<Project>(emptyProject);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const loadProjectMembers = async (projectId: string) => {
    const response = await fetch(`/api/projects/${projectId}/members`, { cache: "no-store" });
    if (response.ok) setTeamMembers(await response.json());
  };

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const projectResponse = await fetch("/api/projects", { cache: "no-store" });

      if (!isMounted) return;
      if (projectResponse.ok) {
        const projectData: Project[] = await projectResponse.json();
        setProjects(projectData);
        if (projectData[0]) {
          setActiveProjectId(projectData[0].id);
          setFormData(projectData[0]);
          await loadProjectMembers(projectData[0].id);
        }
      }
    }

    loadSettings().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwitchProject = (id: string) => {
    const selectedProject = projects.find(p => p.id === id);
    if (!selectedProject) return;
    setActiveProjectId(id);
    setFormData(selectedProject);
    setIsProjectDropdownOpen(false);
    setIsSaved(false);
    setSaveError("");
    setInviteMessage("");
    loadProjectMembers(id).catch(() => undefined);
  };

  const handleSave = async () => {
    if (!formData.id) return;
    setIsSaving(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/projects/${formData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to save project.");
      const updatedProject: Project = payload;
      setProjects(projects.map(project => project.id === updatedProject.id ? updatedProject : project));
      setFormData(updatedProject);
      window.dispatchEvent(new CustomEvent("clarity:project-updated", { detail: updatedProject }));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error: any) {
      setSaveError(error.message || "Unable to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProject = async () => {
    if (projects.length > 0) return;
    setIsCreatingProject(true);
    setSaveError("");
    const suffix = `QA${Date.now().toString(36).slice(-4).toUpperCase()}`;
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Project",
          prefix: suffix,
          description: "",
          priority: "Medium",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create project.");
      const project: Project = payload.project || payload;
      setProjects([project]);
      setActiveProjectId(project.id);
      setFormData(project);
      await loadProjectMembers(project.id);
      window.dispatchEvent(new CustomEvent("clarity:project-updated", { detail: project }));
    } catch (error: any) {
      setSaveError(error.message || "Unable to create project.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleInvite = async () => {
    if (!activeProjectId || !inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteMessage("");
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to invite member.");
      setTeamMembers((members) => {
        const next = members.filter((member) => member.id !== payload.id);
        return [...next, payload].sort((a, b) => a.name.localeCompare(b.name));
      });
      setInviteEmail("");
      setIsInviteOpen(false);
      setInviteMessage("Member added");
    } catch (error: any) {
      setInviteMessage(error.message || "Unable to invite member.");
    } finally {
      setIsInviting(false);
    }
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
              <span className="text-body-md font-medium text-on-surface truncate">{formData.name || "No project selected"}</span>
            </button>
            {isProjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-elevated border border-outline-variant z-10 py-1 overflow-hidden">
                {projects.length === 0 ? (
                  <div className="px-4 py-2.5 text-body-sm text-on-surface-variant">No projects configured</div>
                ) : projects.map(p => (
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
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleCreateProject}
            disabled={projects.length > 0 || isCreatingProject}
            title={projects.length > 0 ? "Only one project for now" : undefined}
          >
            <Plus className="h-4 w-4" /> {isCreatingProject ? "Creating..." : "New Project"}
          </Button>
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
          <label className={labelClass}>Suffix</label>
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
            onChange={(e) => setFormData({...formData, priority: e.target.value as Project["priority"]})}
          >
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex justify-end items-center gap-3">
          {saveError && <span className="text-body-sm text-error font-medium animate-fade-in">{saveError}</span>}
          {isSaved && <span className="text-body-sm text-emerald-600 font-medium animate-fade-in flex items-center gap-1"><Check className="h-4 w-4" /> Saved successfully</span>}
          <Button onClick={handleSave} disabled={!formData.id || isSaving}>
            <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Members
          </h2>
          <Button variant="secondary" size="sm" onClick={() => setIsInviteOpen(true)} disabled={!activeProjectId}>
            <Mail className="h-3.5 w-3.5" /> Invite Member
          </Button>
        </div>

        {isInviteOpen && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 space-y-3 animate-fade-in">
            <label className={labelClass}>Member Email</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                className={inputClass}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
              />
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} className="sm:w-auto">
                <Mail className="h-4 w-4" /> {isInviting ? "Adding..." : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {inviteMessage && (
          <p className={inviteMessage === "Member added" ? "text-body-sm text-emerald-600 font-medium" : "text-body-sm text-error font-medium"}>
            {inviteMessage}
          </p>
        )}

        <div className="divide-y divide-outline-variant/50">
          {teamMembers.length === 0 ? (
            <div className="py-3 text-body-sm text-on-surface-variant">No team members configured.</div>
          ) : teamMembers.map((member) => (
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
  );
}
