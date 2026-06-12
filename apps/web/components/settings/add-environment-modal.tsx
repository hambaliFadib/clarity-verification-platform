"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Environment } from "@/lib/types";

interface AddEnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (env: Environment) => void | Promise<void>;
}

export function AddEnvironmentModal({ isOpen, onClose, onSubmit }: AddEnvironmentModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<Environment["type"]>("Development");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newEnv: Environment = {
      id: `env-${Date.now()}`,
      name,
      url,
      type,
      status: "Active",
      description,
    };
    await onSubmit(newEnv);
    setName("");
    setUrl("");
    setType("Development");
    setDescription("");
    onClose();
  };

  const inputClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-elevated flex flex-col animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">Add Environment</h2>
          <button type="button" onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="env-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Environment Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Staging V2"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Base URL *</label>
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as Environment["type"])} className={inputClass}>
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
              <option value="QA">QA</option>
              <option value="UAT">UAT</option>
              <option value="Production">Production</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about this environment..."
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="env-form">Add Environment</Button>
        </div>
      </div>
    </div>
  );
}
