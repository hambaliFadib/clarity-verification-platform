"use client";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import type { Defect, Environment, TestCase, TestRun } from "@/lib/types";

interface ReportDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (defect: Defect) => void | Promise<void>;
  testCases?: TestCase[];
  testRuns?: TestRun[];
  environments?: Environment[];
  initialData?: Defect;
}

export function ReportDefectModal({
  isOpen,
  onClose,
  onSubmit,
  testCases = [],
  testRuns = [],
  environments = [],
  initialData,
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
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setSeverity(initialData.severity || "Medium");
        setStatus(initialData.status || "Open");
        setType(initialData.type || "Bug");
        setLinkedTestRun(initialData.linkedTestRun || "");
        setLinkedTestCase(initialData.linkedTestCase || "");
        setEnvironment(initialData.environment || "");
        setBrowser(initialData.browser || "");
        setTagsInput(initialData.tags?.join(", ") || "");
      } else {
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
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const defectToSubmit: Defect = {
      id: initialData?.id || `CLR-DEF-${Math.floor(100 + Math.random() * 900)}`,
      title,
      description,
      severity,
      status,
      type,
      priority: severity,
      assignedTo: initialData?.assignedTo || "Unassigned",
      reportedBy: initialData?.reportedBy || "System",
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      ...(linkedTestCase ? { linkedTestCase } : {}),
      ...(linkedTestRun && linkedTestRun !== "Manual" ? { linkedTestRun } : {}),
      ...(environment ? { environment } : {}),
      ...(browser ? { browser } : {}),
    };

    await onSubmit(defectToSubmit);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader onClose={onClose}>
        <ModalTitle>{initialData ? "Edit Defect" : "Report New Defect"}</ModalTitle>
      </ModalHeader>

      <ModalBody className="overflow-y-auto max-h-[60vh]">
        <form id="defect-form" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Defect Title *</Label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <Label>Description & Steps to Reproduce</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details and steps to reproduce..."
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Severity</Label>
              <Select value={severity} onChange={(e) => setSeverity(e.target.value as Defect["severity"])}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Defect["status"])}>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Blocked">Blocked</option>
              </Select>
            </div>

            <div>
              <Label>Test Run Category</Label>
              <Select value={linkedTestRun} onChange={(e) => setLinkedTestRun(e.target.value)}>
                <option value="Manual">Manual</option>
                {testRuns.map(run => (
                  <option key={run.id} value={run.name}>{run.name}</option>
                ))}
                <option value="Debug Test Run">Debug Test Run</option>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as Defect["type"])}>
                <option value="Bug">Bug</option>
                <option value="Enhancement">Enhancement</option>
                <option value="Task">Task</option>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label>Linked Test Case (Optional)</Label>
              <Select value={linkedTestCase} onChange={(e) => setLinkedTestCase(e.target.value)}>
                <option value="">-- No Test Case Linked --</option>
                {testCases.map((tc) => (
                  <option key={tc.id} value={tc.id}>{tc.id} - {tc.title.substring(0, 50)}...</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <Label>Environment</Label>
              <Select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
                <option value="">-- Select Environment --</option>
                {environments.map(env => (
                  <option key={env.id} value={env.name}>{env.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Browser / OS</Label>
              <Input
                value={browser}
                onChange={(e) => setBrowser(e.target.value)}
                placeholder="e.g. Chrome 126, iOS 17"
              />
            </div>
          </div>

          <div>
            <Label>Tags (Comma Separated)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="ui, login, api..."
            />
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="defect-form">
          {initialData ? "Save Changes" : "Create Defect"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
