"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";

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
      setName("");
      setEnvironment("Staging");
      setRelease("");
      setType("Regression");
    }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" preventClose={isSubmitting}>
      <ModalHeader onClose={onClose} closeDisabled={isSubmitting}>
        <ModalTitle>Create Test Run</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <form id="create-run-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="run-name">Run Name *</Label>
            <Input
              id="run-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Release Regression"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="run-env">Environment *</Label>
              <Select
                id="run-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              >
                <option value="Development">Development</option>
                <option value="Staging">Staging</option>
                <option value="UAT">UAT</option>
                <option value="Production">Production</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="run-type">Test Type *</Label>
              <Select
                id="run-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="Regression">Regression</option>
                <option value="Smoke">Smoke</option>
                <option value="Sanity">Sanity</option>
                <option value="Integration">Integration</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="run-release">Release Version</Label>
            <Input
              id="run-release"
              value={release}
              onChange={(e) => setRelease(e.target.value)}
              placeholder="e.g. v2.4.1"
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" form="create-run-form" loading={isSubmitting}>
          Create Run
        </Button>
      </ModalFooter>
    </Modal>
  );
}
