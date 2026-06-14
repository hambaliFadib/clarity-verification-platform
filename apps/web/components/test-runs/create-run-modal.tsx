"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreateRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    environment: string;
    release?: string;
    type: string;
  }) => Promise<void>;
}

export function CreateRunModal({ isOpen, onClose, onSubmit }: CreateRunModalProps) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("Staging");
  const [release, setRelease] = useState("");
  const [type, setType] = useState("Regression");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setName("");
      setEnvironment("Staging");
      setRelease("");
      setType("Regression");
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ name, environment, release, type });
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

      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-elevated flex flex-col border border-outline-variant animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
            Create Test Run
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

        <div className="p-6">
          <form id="create-run-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass} htmlFor="run-name">Run Name *</label>
              <input
                id="run-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Release Regression"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass} htmlFor="run-env">Environment *</label>
                <select
                  id="run-env"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className={inputClass}
                >
                  <option value="Development">Development</option>
                  <option value="Staging">Staging</option>
                  <option value="UAT">UAT</option>
                  <option value="Production">Production</option>
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="run-type">Test Type *</label>
                <select
                  id="run-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="Regression">Regression</option>
                  <option value="Smoke">Smoke</option>
                  <option value="Sanity">Sanity</option>
                  <option value="Integration">Integration</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="run-release">Release Version</label>
              <input
                id="run-release"
                value={release}
                onChange={(e) => setRelease(e.target.value)}
                placeholder="e.g. v2.4.1"
                className={inputClass}
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="create-run-form" loading={isSubmitting}>
            Create Run
          </Button>
        </div>
      </div>
    </div>
  );
}
