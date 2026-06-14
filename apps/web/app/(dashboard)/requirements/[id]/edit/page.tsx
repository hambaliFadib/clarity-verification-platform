"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Requirement } from "@/lib/types";

export default function EditRequirementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Requirement> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadReq() {
      try {
        const response = await fetch(`/api/requirements/${id}`);
        if (response.ok) {
          setFormData(await response.json());
        } else {
          toast.error("Requirement not found");
          router.push("/requirements");
        }
      } catch (error) {
        console.error("Failed to load requirement", error);
        toast.error("Failed to load requirement details");
      }
    }
    loadReq();
  }, [id, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success("Requirement updated successfully!");
        router.push(`/requirements/${id}`);
      } else {
        throw new Error("Failed to update requirement");
      }
    } catch (error) {
      toast.error("Failed to update requirement. Please try again.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  if (!formData) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse h-8 w-32 bg-surface-container-low rounded-md" />
        <div className="animate-pulse h-12 w-2/3 bg-surface-container-low rounded-lg" />
        <div className="animate-pulse h-96 w-full bg-surface-container-low rounded-xl" />
      </div>
    );
  }

  const inputClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer w-fit">
        <Link href={`/requirements/${id}`} className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Requirement
        </Link>
      </div>

      <div>
        <h1 className="text-display-sm font-semibold text-on-surface">Edit Requirement</h1>
        <p className="text-on-surface-variant mt-1">Update details for {formData.displayId}</p>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl shadow-subtle p-6">
        <form id="edit-requirement-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass} htmlFor="req-title">Title *</label>
            <input
              id="req-title"
              required
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelClass} htmlFor="req-module">Module *</label>
              <input
                id="req-module"
                required
                value={formData.module || ""}
                onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="req-type">Type *</label>
              <select
                id="req-type"
                value={formData.type || "Functional"}
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
                value={formData.priority || "Medium"}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Requirement["priority"] })}
                className={inputClass}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="req-status">Status</label>
              <select
                id="req-status"
                value={formData.status || "Draft"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Requirement["status"] })}
                className={inputClass}
              >
                <option value="Draft">Draft</option>
                <option value="Ready">Ready</option>
                <option value="In Review">In Review</option>
                <option value="Approved">Approved</option>
                <option value="Baseline">Baseline</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="req-description">Description</label>
            <textarea
              id="req-description"
              rows={4}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="req-criteria">Acceptance Criteria</label>
            <textarea
              id="req-criteria"
              rows={4}
              value={formData.acceptanceCriteria || ""}
              onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="req-rules">Business Rules</label>
            <textarea
              id="req-rules"
              rows={3}
              value={formData.businessRules || ""}
              onChange={(e) => setFormData({ ...formData, businessRules: e.target.value })}
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
