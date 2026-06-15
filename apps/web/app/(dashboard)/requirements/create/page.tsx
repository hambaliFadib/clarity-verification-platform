"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Requirement } from "@/lib/types";

const emptyRequirement: Partial<Requirement> = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  businessRules: "",
  module: "",
  type: "Functional",
  priority: "Medium",
};

export default function CreateRequirementPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Requirement>>(emptyRequirement);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const created = await response.json();
        if (created?.id?.startsWith("guest-")) {
          sessionStorage.setItem(`guest-requirement:${created.id}`, JSON.stringify(created));
        }
        toast.success("Requirement created successfully!");
        router.push(`/requirements/${created.id}`);
      } else {
        throw new Error("Failed to create requirement");
      }
    } catch (error) {
      toast.error("Failed to create requirement. Please try again.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer w-fit">
        <Link href="/requirements" className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Requirements
        </Link>
      </div>

      <div>
        <h1 className="text-display-sm font-semibold text-on-surface">Create Requirement</h1>
        <p className="text-on-surface-variant mt-1">Add a new requirement to the project.</p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl shadow-subtle p-6">
        <form id="create-requirement-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass} htmlFor="req-title">Title *</label>
            <input
              id="req-title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. User Login Authentication"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className={labelClass} htmlFor="req-module">Module *</label>
              <input
                id="req-module"
                required
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                placeholder="e.g. Authentication"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="req-type">Type *</label>
              <select
                id="req-type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={inputClass}
              >
                <option value="Functional">Functional</option>
                <option value="Non-Functional">Non-Functional</option>
                <option value="Business">Business</option>
                <option value="Security">Security</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="req-priority">Priority *</label>
              <select
                id="req-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Requirement["priority"] })}
                className={inputClass}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="req-description">Description</label>
            <textarea
              id="req-description"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the requirement..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="req-criteria">Acceptance Criteria</label>
            <textarea
              id="req-criteria"
              rows={4}
              value={formData.acceptanceCriteria}
              onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
              placeholder="- User can login with valid credentials&#10;- Error message shown on invalid login"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="req-rules">Business Rules</label>
            <textarea
              id="req-rules"
              rows={3}
              value={formData.businessRules}
              onChange={(e) => setFormData({ ...formData, businessRules: e.target.value })}
              placeholder="Any specific business rules or constraints..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create Requirement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
