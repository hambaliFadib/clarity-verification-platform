"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Label, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Critical", value: "Critical" },
];

interface CreateProjectModalProps {
  onCreated?: (project: any) => void;
}

export function CreateProjectButton({ onCreated }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-4 min-h-[140px] hover:border-primary hover:bg-[#F0F7FF] transition-all duration-300 cursor-pointer text-outline hover:text-primary group"
      >
        <span className="material-symbols-outlined text-[24px] mb-2 group-hover:scale-110 transition-transform duration-300">
          add_circle
        </span>
        <span className="font-bold text-body-md">Create New Project</span>
      </div>

      <CreateProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  );
}

interface ModalInternalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: any) => void;
}

function CreateProjectModal({ open, onClose, onCreated }: ModalInternalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const suffixTouched = useRef(false);

  const handleClose = useCallback(() => {
    if (loading) return;
    setName("");
    setSuffix("");
    setDescription("");
    setPriority("Medium");
    setError(null);
    suffixTouched.current = false;
    onClose();
  }, [loading, onClose]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!suffixTouched.current) {
      const auto = val
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 5);
      setSuffix(auto);
    }
  };

  const handleSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    suffixTouched.current = true;
    setSuffix(
      e.target.value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 8),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !suffix.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          prefix: suffix.trim(),
          description: description.trim() || undefined,
          priority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create project");
      handleClose();
      if (onCreated) onCreated(data.project);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} preventClose={loading} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={handleClose} closeDisabled={loading}>
          <span className="material-symbols-outlined text-[20px] text-primary">
            folder_open
          </span>
          <ModalTitle>New Project</ModalTitle>
        </ModalHeader>

        <ModalBody className="flex flex-col gap-4">
          {error && (
            <div className="text-danger text-body-sm bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="proj-name">
              Project Name <span className="text-danger">*</span>
            </Label>
            <Input
              id="proj-name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Mobile Banking App"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="proj-suffix">
              Suffix <span className="text-danger">*</span>
            </Label>
            <Input
              id="proj-suffix"
              value={suffix}
              onChange={handleSuffixChange}
              placeholder="e.g. MBA"
              disabled={loading}
              required
              maxLength={8}
            />
            <p className="text-caption text-on-surface-variant mt-1">
              Short code used as identifier for test case IDs (e.g. MBA-001)
            </p>
          </div>

          <div>
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              disabled={loading}
              className="min-h-[72px]"
            />
          </div>

          <div>
            <Label>Default Priority</Label>
            <Select
              value={priority}
              onChange={setPriority}
              options={PRIORITY_OPTIONS}
              disabled={loading}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-body-md font-medium rounded-md border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim() || !suffix.trim()}
            className="px-4 py-2 text-body-md font-medium rounded-md bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
            )}
            {loading ? "Creating…" : "Create Project"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
