"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Requirement } from "@/lib/types";

interface CreateRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requirement: Partial<Requirement>) => Promise<void>;
  initialData?: Requirement;
}

const emptyRequirement: Partial<Requirement> = {
  title: "",
  description: "",
  acceptanceCriteria: "",
  businessRules: "",
  module: "",
  type: "Functional",
  priority: "Medium",
};

export function CreateRequirementModal({ isOpen, onClose, onSubmit, initialData }: CreateRequirementModalProps) {
  const [formData, setFormData] = useState<Partial<Requirement>>(initialData || emptyRequirement);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setFormData(initialData || emptyRequirement);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={isSubmitting ? undefined : onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-elevated flex flex-col max-h-[90vh] animate-scale-in border border-outline-variant">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
            {initialData ? "Edit Requirement" : "New Requirement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="requirement-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="requirement-title">Title *</label>
              <input
                id="requirement-title"
                required
                value={formData.title || ""}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                placeholder="e.g. User Login Authentication"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="requirement-module">Module *</label>
                <input
                  id="requirement-module"
                  required
                  value={formData.module || ""}
                  onChange={(event) => setFormData({ ...formData, module: event.target.value })}
                  placeholder="e.g. Authentication"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="requirement-type">Type *</label>
                <select
                  id="requirement-type"
                  value={formData.type || "Functional"}
                  onChange={(event) => setFormData({ ...formData, type: event.target.value })}
                  className={inputClass}
                >
                  <option value="Functional">Functional</option>
                  <option value="Non-Functional">Non-Functional</option>
                  <option value="Business">Business</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="requirement-priority">Priority *</label>
                <select
                  id="requirement-priority"
                  value={formData.priority || "Medium"}
                  onChange={(event) => setFormData({ ...formData, priority: event.target.value as Requirement["priority"] })}
                  className={inputClass}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {initialData && (
                <div>
                  <label className={labelClass} htmlFor="requirement-status">Status</label>
                  <select
                    id="requirement-status"
                    value={formData.status || "Draft"}
                    onChange={(event) => setFormData({ ...formData, status: event.target.value as Requirement["status"] })}
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
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="requirement-description">Description</label>
              <textarea
                id="requirement-description"
                rows={3}
                value={formData.description || ""}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Detailed description of the requirement..."
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="requirement-criteria">Acceptance Criteria</label>
              <textarea
                id="requirement-criteria"
                rows={3}
                value={formData.acceptanceCriteria || ""}
                onChange={(event) => setFormData({ ...formData, acceptanceCriteria: event.target.value })}
                placeholder="- User can login with valid credentials&#10;- Error message shown on invalid login"
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="requirement-rules">Business Rules</label>
              <textarea
                id="requirement-rules"
                rows={2}
                value={formData.businessRules || ""}
                onChange={(event) => setFormData({ ...formData, businessRules: event.target.value })}
                placeholder="Any specific business rules or constraints..."
                className={`${inputClass} resize-y`}
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="requirement-form" loading={isSubmitting}>
            {initialData ? "Save Changes" : "Create Requirement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
