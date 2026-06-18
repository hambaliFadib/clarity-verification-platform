"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface ModuleFormData {
  name: string;
  description: string;
}

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  initialData?: ModuleFormData;
  mode: "create" | "edit";
}

export function CreateModuleModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: CreateModuleModalProps) {
  const [formData, setFormData] = useState<ModuleFormData>({
    name: "",
    description: "",
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { name: "", description: "" });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Module name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(mode === "create" ? "Module created successfully" : "Module updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to save module");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-outline-variant">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="text-title-md font-semibold text-on-surface">
            {mode === "create" ? "New Module" : "Edit Module"}
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
              placeholder="e.g., Authentication"
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
              rows={3}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all text-body-md resize-y"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Module" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
