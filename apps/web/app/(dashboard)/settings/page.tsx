"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Settings, AlertTriangle, Check } from "lucide-react";
import type { Project, TestCasePriority } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";

const emptyProject: Project = {
  id: "",
  name: "",
  prefix: "",
  description: "",
  priority: "Medium",
};

const inputClass =
  "w-full border border-outline-variant rounded-md px-3 py-2.5 text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";
const labelClass =
  "block text-label-sm font-bold text-on-surface-variant mb-1.5";

export default function ProjectSettingsPage() {
  const [formData, setFormData] = useState<Project>(emptyProject);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const projectResponse = await fetch("/api/projects?limit=1", { cache: "no-store" });

      if (!isMounted) return;
      if (projectResponse.ok) {
        const projectData: Project[] = await projectResponse.json();
        if (projectData[0]) {
          setFormData(projectData[0]);
        }
      }
    }

    loadSettings().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Settings"
        subtitle="Manage configuration and details for the current project."
      />

      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm animate-fade-in">
        <div className="px-8 py-6 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest">
          <div>
            <h2 className="text-headline-sm font-bold text-primary flex items-center gap-2">
              <Settings className="h-5 w-5" /> General Configuration
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isSaved && <span className="text-body-sm text-emerald-600 font-medium flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
            {saveError && <span className="text-body-sm text-error font-medium">{saveError}</span>}
            <Button onClick={handleSave} disabled={!formData.id || isSaving} className="shadow-sm">
              <Save className="h-4 w-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="p-8 flex flex-col gap-8">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-7 flex flex-col gap-6">

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Project Name</label>
                <input
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Project Prefix</label>
                  <input
                    className={inputClass}
                    value={formData.prefix}
                    onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
                    maxLength={5}
                    placeholder="e.g. TC"
                  />
                  <p className="text-[10px] text-outline mt-1">Used for issue keys (e.g., {formData.prefix || "PROJ"}-123)</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Default Priority</label>
                  <select
                    className={inputClass}
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TestCasePriority})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Description (Optional)</label>
                <textarea
                  className={`${inputClass} min-h-[100px] resize-y`}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="High-performance quality assurance project."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-error-container/20 rounded-xl border border-error/30 p-8 flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center gap-2 text-error">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-label-lg font-bold uppercase tracking-wider">Danger Zone</h3>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-title-md font-semibold text-on-surface">Archive Project</p>
            <p className="text-body-sm text-on-surface-variant mt-1">Permanently deactivate this project. This action cannot be undone.</p>
          </div>
          <Button variant="destructive" className="bg-transparent border border-error text-error hover:bg-error/10 whitespace-nowrap">
            Archive Project
          </Button>
        </div>
      </div>
    </div>
  );
}
