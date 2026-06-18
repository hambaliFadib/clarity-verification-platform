"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
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
      setFormData(initialData || emptyRequirement);
    }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" preventClose={isSubmitting}>
      <ModalHeader onClose={onClose} closeDisabled={isSubmitting}>
        <ModalTitle>{initialData ? "Edit Requirement" : "New Requirement"}</ModalTitle>
      </ModalHeader>

      <ModalBody className="overflow-y-auto max-h-[60vh]">
        <form id="requirement-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="requirement-title">Title *</Label>
            <Input
              id="requirement-title"
              required
              value={formData.title || ""}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="e.g. User Login Authentication"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="requirement-module">Module *</Label>
              <Input
                id="requirement-module"
                required
                value={formData.module || ""}
                onChange={(event) => setFormData({ ...formData, module: event.target.value })}
                placeholder="e.g. Authentication"
              />
            </div>

            <div>
              <Label htmlFor="requirement-type">Type *</Label>
              <Select
                id="requirement-type"
                value={formData.type || "Functional"}
                onChange={(event) => setFormData({ ...formData, type: event.target.value })}
              >
                <option value="Functional">Functional</option>
                <option value="Non-Functional">Non-Functional</option>
                <option value="Business">Business</option>
                <option value="Security">Security</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="requirement-priority">Priority *</Label>
              <Select
                id="requirement-priority"
                value={formData.priority || "Medium"}
                onChange={(event) => setFormData({ ...formData, priority: event.target.value as Requirement["priority"] })}
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </div>

            {initialData && (
              <div>
                <Label htmlFor="requirement-status">Status</Label>
                <Select
                  id="requirement-status"
                  value={formData.status || "Draft"}
                  onChange={(event) => setFormData({ ...formData, status: event.target.value as Requirement["status"] })}
                >
                  <option value="Draft">Draft</option>
                  <option value="Ready">Ready</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Baseline">Baseline</option>
                  <option value="Archived">Archived</option>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="requirement-description">Description</Label>
            <Textarea
              id="requirement-description"
              rows={3}
              value={formData.description || ""}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Detailed description of the requirement..."
            />
          </div>

          <div>
            <Label htmlFor="requirement-criteria">Acceptance Criteria</Label>
            <Textarea
              id="requirement-criteria"
              rows={3}
              value={formData.acceptanceCriteria || ""}
              onChange={(event) => setFormData({ ...formData, acceptanceCriteria: event.target.value })}
              placeholder={"- User can login with valid credentials\n- Error message shown on invalid login"}
            />
          </div>

          <div>
            <Label htmlFor="requirement-rules">Business Rules</Label>
            <Textarea
              id="requirement-rules"
              rows={2}
              value={formData.businessRules || ""}
              onChange={(event) => setFormData({ ...formData, businessRules: event.target.value })}
              placeholder="Any specific business rules or constraints..."
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" form="requirement-form" loading={isSubmitting}>
          {initialData ? "Save Changes" : "Create Requirement"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
