"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import type { WorkItem } from "@/lib/types";

type FormValues = {
  title: string;
  type: string;
  priority: string;
  status: string;
  progress: number;
  testCaseId: string;
  defectId: string;
  assignedTo: string;
  dueIn: string;
};

interface CreateWorkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  workItem?: WorkItem | null;
}

const inputClass = "w-full bg-card border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all";
const selectClass = `${inputClass} appearance-none`;
const labelClass = "block text-label-md font-semibold text-on-surface mb-1.5";

export function CreateWorkItemModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create",
  workItem = null,
}: CreateWorkItemModalProps) {
  const { data: session } = useSession();
  const [testCases, setTestCases] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const isEditing = mode === "edit" && !!workItem;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      type: "Task",
      priority: "Medium",
      status: "To Do",
      progress: 0,
      testCaseId: "",
      defectId: "",
      assignedTo: "",
      dueIn: "Today",
    }
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (isOpen && !isEditing && session?.user?.name && !watch("assignedTo")) {
      setValue("assignedTo", session.user.name);
    }
  }, [isOpen, isEditing, session, setValue, watch]);

  useEffect(() => {
    if (!isOpen) return;
    reset({
      title: workItem?.title || "",
      type: workItem?.type || "Task",
      priority: workItem?.priority || "Medium",
      status: workItem?.status || "To Do",
      progress: workItem?.progress ?? 0,
      testCaseId: workItem?.testCaseId || "",
      defectId: workItem?.defectId || "",
      assignedTo: workItem?.assignedTo || session?.user?.name || "",
      dueIn: workItem?.dueIn || "Today",
    });
  }, [isOpen, reset, session?.user?.name, workItem]);

  useEffect(() => {
    if (isOpen) {
      const loadRelatedData = async () => {
        setIsLoadingRelated(true);
        try {
          const [tcRes, defRes] = await Promise.all([
            fetch("/api/test-cases"),
            fetch("/api/defects")
          ]);
          if (tcRes.ok) {
            const tcData = await tcRes.json();
            setTestCases(Array.isArray(tcData) ? tcData : tcData.items || []);
          }
          if (defRes.ok) setDefects(await defRes.json());
        } catch (error) {
          console.error("Failed to load related data", error);
        } finally {
          setIsLoadingRelated(false);
        }
      };
      loadRelatedData();
    }
  }, [isOpen]);

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: any = {
        title: data.title,
        type: data.type,
        status: data.status || "To Do",
        priority: data.priority,
        progress: Number(data.progress) || 0,
        assigned_to: data.assignedTo || session?.user?.name || "Unassigned",
        due_in: data.dueIn,
      };

      if (data.type === "Test Case" && data.testCaseId) {
        payload.test_case_id = data.testCaseId;
        payload.defect_id = null;
        const tc = testCases.find(t => (t.realId || t.id) === data.testCaseId);
        if (tc) {
          const displayId = tc.id || (tc.realId ? tc.realId.substring(0, 8) : "Unknown");
          payload.scope = `TC: ${displayId}`;
        }
      } else if (data.type === "Defect" && data.defectId) {
        payload.defect_id = data.defectId;
        payload.test_case_id = null;
        const df = defects.find(d => (d.realId || d.id) === data.defectId);
        if (df) {
          const displayId = df.id || (df.realId ? df.realId.substring(0, 8) : "Unknown");
          payload.scope = `Defect: ${displayId}`;
        }
      } else {
        payload.scope = null;
        payload.test_case_id = null;
        payload.defect_id = null;
      }

      const response = await fetch(isEditing ? `/api/work-items/${workItem.id}` : "/api/work-items", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} work item`);
      }

      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(`Error ${isEditing ? "updating" : "creating"} work item`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" preventClose={isSubmitting}>
      <ModalHeader onClose={onClose} closeDisabled={isSubmitting}>
        <ModalTitle>{isEditing ? "Edit Work Item" : "New Work Item"}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <form id="work-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Title <span className="text-error">*</span></label>
            <input
              {...register("title", { required: "Title is required", minLength: 2 })}
              className={inputClass}
              placeholder="e.g., Run regression tests for auth module"
            />
            {errors.title && <p className="text-error text-body-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select {...register("type")} className={selectClass}>
                <option value="Task">Task</option>
                <option value="Test Case">Testing (Test Case)</option>
                <option value="Defect">Regression Test (Defect)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select {...register("priority")} className={selectClass}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select {...register("status")} className={selectClass}>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Progress</label>
              <input
                {...register("progress", { valueAsNumber: true, min: 0, max: 100 })}
                type="number"
                min={0}
                max={100}
                className={inputClass}
              />
            </div>
          </div>

          {selectedType === "Test Case" && (
            <div>
              <label className={labelClass}>Select Test Case</label>
              {isLoadingRelated ? (
                <div className="flex items-center gap-2 text-body-sm text-outline px-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading test cases...
                </div>
              ) : (
                <select
                  {...register("testCaseId", { required: "Test case is required for testing" })}
                  className={selectClass}
                >
                  <option value="">-- Select Test Case --</option>
                  {testCases.map((tc) => (
                    <option key={tc.realId || tc.id} value={tc.realId || tc.id}>
                      {tc.id ? `${tc.id} - ` : ""}{tc.title}
                    </option>
                  ))}
                </select>
              )}
              {errors.testCaseId && <p className="text-error text-body-sm mt-1">{errors.testCaseId.message}</p>}
            </div>
          )}

          {selectedType === "Defect" && (
            <div>
              <label className={labelClass}>Select Defect for Regression</label>
              {isLoadingRelated ? (
                <div className="flex items-center gap-2 text-body-sm text-outline px-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading defects...
                </div>
              ) : (
                <select
                  {...register("defectId", { required: "Defect is required for regression test" })}
                  className={selectClass}
                >
                  <option value="">-- Select Defect --</option>
                  {defects.map((df) => (
                    <option key={df.realId || df.id} value={df.realId || df.id}>
                      {df.id ? `${df.id} - ` : ""}{df.title}
                    </option>
                  ))}
                </select>
              )}
              {errors.defectId && <p className="text-error text-body-sm mt-1">{errors.defectId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Assignee</label>
              <select
                {...register("assignedTo")}
                className={`${selectClass} opacity-80 cursor-not-allowed`}
                disabled
              >
                <option value={session?.user?.name || ""}>{session?.user?.name || "Current User"}</option>
                <option value="other" disabled>Assign to another PIC (Coming soon)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Due In</label>
              <input
                {...register("dueIn")}
                className={inputClass}
                placeholder="e.g. 3 days"
              />
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" form="work-item-form" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {isEditing ? "Saving..." : "Creating..."}</>
          ) : (
            <><Save className="h-4 w-4" /> {isEditing ? "Save Changes" : "Create Work Item"}</>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
