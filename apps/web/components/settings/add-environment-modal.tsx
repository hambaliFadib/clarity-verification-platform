"use client";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Add Environment</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <form id="env-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="env-name">Environment Name *</Label>
            <Input id="env-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Staging V2" />
          </div>
          <div>
            <Label htmlFor="env-url">Base URL *</Label>
            <Input id="env-url" required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="env-type">Type</Label>
            <Select id="env-type" value={type} onChange={(e) => setType(e.target.value as Environment["type"])}>
              <option value="Development">Development</option>
              <option value="Staging">Staging</option>
              <option value="QA">QA</option>
              <option value="UAT">UAT</option>
              <option value="Production">Production</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="env-desc">Description</Label>
            <Textarea id="env-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief details about this environment..." className="min-h-[80px]" />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="env-form">Add Environment</Button>
      </ModalFooter>
    </Modal>
  );
}
