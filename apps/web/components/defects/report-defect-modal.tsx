"use client";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Defect, Environment, TestCase, TestRun } from "@/lib/types";

interface ReportDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (defect: Defect) => void | Promise<void>;
  testCases?: TestCase[];
  testRuns?: TestRun[];
  environments?: Environment[];
}

export function ReportDefectModal({
  isOpen,
  onClose,
  onSubmit,
  testCases = [],
  testRuns = [],
  environments = [],
}: ReportDefectModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Defect["severity"]>("Medium");
  const [status, setStatus] = useState<Defect["status"]>("Open");
  const [type, setType] = useState<Defect["type"]>("Bug");
  const [linkedTestRun, setLinkedTestRun] = useState<string>("");
  const [linkedTestCase, setLinkedTestCase] = useState<string>("");
  const [environment, setEnvironment] = useState<string>("");
  const [browser, setBrowser] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newDefect: Defect = {
      id: `CLR-DEF-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      severity,
      status,
      type,
      priority: severity,
      assignedTo: "Unassigned",
      reportedBy: "System",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      ...(linkedTestCase ? { linkedTestCase } : {}),
      ...(linkedTestRun && linkedTestRun !== "Manual" ? { linkedTestRun } : {}),
      ...(environment ? { environment } : {}),
      ...(browser ? { browser } : {}),
    };

    await onSubmit(newDefect);
    setTitle("");
    setDescription("");
    setSeverity("Medium");
    setStatus("Open");
    setType("Bug");
    setLinkedTestRun("");
    setLinkedTestCase("");
    setEnvironment("");
    setBrowser("");
    setTagsInput("");
    onClose();
  };

  const inputClass = "w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
  const labelClass = "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-elevated flex flex-col max-h-[90vh] animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">Report New Defect</h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="defect-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Defect Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Description & Steps to Reproduce</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details and steps to reproduce..."
                className={`${inputClass} min-h-[120px] resize-y`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as Defect["severity"])} className={inputClass}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Defect["status"])} className={inputClass}>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Test Run Category</label>
                <select value={linkedTestRun} onChange={(e) => setLinkedTestRun(e.target.value)} className={inputClass}>
                  <option value="Manual">Manual</option>
                  {testRuns.map(run => (
                    <option key={run.id} value={run.name}>{run.name}</option>
                  ))}
                  <option value="Debug Test Run">Debug Test Run</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as Defect["type"])} className={inputClass}>
                  <option value="Bug">Bug</option>
                  <option value="Enhancement">Enhancement</option>
                  <option value="Task">Task</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Linked Test Case (Optional)</label>
                <select value={linkedTestCase} onChange={(e) => setLinkedTestCase(e.target.value)} className={inputClass}>
                  <option value="">-- No Test Case Linked --</option>
                  {testCases.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.id} - {tc.title.substring(0, 50)}...</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Environment</label>
                <select value={environment} onChange={(e) => setEnvironment(e.target.value)} className={inputClass}>
                  <option value="">-- Select Environment --</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.name}>{env.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Browser / OS</label>
                <input
                  value={browser}
                  onChange={(e) => setBrowser(e.target.value)}
                  placeholder="e.g. Chrome 126, iOS 17"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tags (Comma Separated)</label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ui, login, api..."
                className={inputClass}
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="defect-form">
            Create Defect
          </Button>
        </div>
      </div>
    </div>
  );
}
