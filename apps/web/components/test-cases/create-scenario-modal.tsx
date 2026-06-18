"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ScenarioFormData {
  name: string;
  description: string;
  asA?: string;
  iWant?: string;
  soThat?: string;
}

interface CreateScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScenarioFormData) => Promise<void>;
  initialData?: ScenarioFormData;
  mode: "create" | "edit";
}

export function CreateScenarioModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: CreateScenarioModalProps) {
  const [formData, setFormData] = useState<ScenarioFormData>({
    name: "",
    description: "",
    asA: "",
    iWant: "",
    soThat: "",
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: "", description: "", asA: "", iWant: "", soThat: "" });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Scenario name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(mode === "create" ? "Scenario created successfully" : "Scenario updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to save scenario");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg border border-outline-variant">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="text-title-md font-semibold text-on-surface">
            {mode === "create" ? "New Scenario" : "Edit Scenario"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high transition-colors rounded-md text-on-surface-variant">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-body-sm font-medium mb-1.5 text-on-surface">Name <span className="text-error">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Login Scenario"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-body-md"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium mb-1.5 text-on-surface">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-body-md resize-y"
            />
          </div>

          <div className="border-t border-outline-variant pt-4 mt-2">
            <p className="text-body-sm font-medium mb-3 text-on-surface">Gherkin Format <span className="text-muted-foreground font-normal">(Optional)</span></p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">As a</label>
                <input
                  type="text"
                  value={formData.asA || ""}
                  onChange={(e) => setFormData({ ...formData, asA: e.target.value })}
                  placeholder="user"
                  className="w-full px-2 py-1.5 text-sm border border-outline-variant rounded focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">I want to</label>
                <input
                  type="text"
                  value={formData.iWant || ""}
                  onChange={(e) => setFormData({ ...formData, iWant: e.target.value })}
                  placeholder="login"
                  className="w-full px-2 py-1.5 text-sm border border-outline-variant rounded focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">So that</label>
                <input
                  type="text"
                  value={formData.soThat || ""}
                  onChange={(e) => setFormData({ ...formData, soThat: e.target.value })}
                  placeholder="access my account"
                  className="w-full px-2 py-1.5 text-sm border border-outline-variant rounded focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Scenario" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
