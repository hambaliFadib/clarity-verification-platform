"use client";
import { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Save, Settings, AlertTriangle, Image as ImageIcon, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const inputClass =
  "w-full border border-outline-variant rounded-md px-3 py-2.5 text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";
const labelClass =
  "block text-label-sm font-bold text-on-surface-variant mb-1.5";

export default function PlatformGeneralPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      const projectResponse = await fetch("/api/projects", { cache: "no-store" });
      if (!isMounted) return;
      if (projectResponse.ok) {
        const projectData: Project[] = await projectResponse.json();
        setProjects(projectData);
        if (projectData[0]) {
          setActiveProjectId(projectData[0].id);
        }
      }
    }
    loadProjects().catch(() => undefined);
    return () => { isMounted = false; };
  }, []);

  const handleSwitchProject = (id: string) => {
    setActiveProjectId(id);
    setIsProjectDropdownOpen(false);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="General Settings"
        subtitle="Configure your workspace details, branding, and localization preferences."
      />

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest">
          <div>
            <h2 className="text-headline-sm font-bold text-primary flex items-center gap-2">
              <Settings className="h-5 w-5" /> Platform Configuration
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isSaved && <span className="text-body-sm text-emerald-600 font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
            <Button onClick={handleSave} disabled={isSaving} className="shadow-sm">
              <Save className="h-4 w-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="p-8 flex flex-col gap-10">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Target Project</label>
                <p className="text-body-sm text-on-surface-variant mb-2 -mt-1">Select the project scope for these settings.</p>
                <div className="relative w-full">
                  <button
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    className={inputClass + " text-left flex items-center justify-between"}
                  >
                    <span className="truncate">
                      {projects.find((p) => p.id === activeProjectId)?.name || "No project selected"}
                    </span>
                  </button>
                  {isProjectDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-elevated border border-outline-variant z-10 py-1 overflow-hidden">
                      {projects.length === 0 ? (
                        <div className="px-4 py-2.5 text-body-sm text-on-surface-variant">No projects configured</div>
                      ) : projects.map((p) => (
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
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description (Optional)</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  defaultValue="High-performance quality assurance workspace for enterprise deployments."
                />
              </div>
            </div>

            <div className="col-span-12 md:col-span-5">
              <label className={labelClass}>Brand Logo</label>
              <div className="relative group cursor-pointer h-48 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-surface-container-lowest transition-all">
                <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform border border-outline-variant">
                  <ImageIcon className="h-8 w-8 text-on-surface-variant" />
                </div>
                <div className="text-center">
                  <p className="text-label-lg font-medium text-primary">Upload new logo</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">PNG, JPG up to 5MB</p>
                </div>
                <input className="absolute inset-0 opacity-0 cursor-pointer" type="file" />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-outline-variant/50 w-full"></div>

          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
              <label className={labelClass}>Default Language</label>
              <select className={inputClass}>
                <option>English (United States)</option>
                <option>German (DE)</option>
                <option>Japanese (JP)</option>
                <option>Spanish (ES)</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
              <label className={labelClass}>Timezone</label>
              <select className={inputClass}>
                <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                <option>(GMT+00:00) Western European Time</option>
                <option>(GMT+05:30) India Standard Time</option>
                <option>(GMT+09:00) Japan Standard Time</option>
              </select>
            </div>
          </div>

          <div className="h-[1px] bg-outline-variant/50 w-full"></div>

          <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-xl border border-outline-variant">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-error-container/50 flex items-center justify-center text-error">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-title-md font-semibold text-on-surface">Maintenance Mode</h3>
                <p className="text-body-sm text-on-surface-variant mt-1">Temporarily disable workspace access for non-admin users during updates.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-error-container/20 rounded-xl border border-error/30 p-8 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-error">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-label-lg font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-title-md font-semibold text-on-surface">Archive Workspace</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Permanently deactivate this workspace and all associated projects. This action cannot be undone.</p>
          </div>
          <Button variant="destructive" className="bg-transparent border border-error text-error hover:bg-error/10 whitespace-nowrap">
            Archive NexQA
          </Button>
        </div>
      </div>
    </div>
  );
}
