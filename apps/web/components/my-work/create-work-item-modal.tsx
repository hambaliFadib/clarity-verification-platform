"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
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

export function CreateWorkItemModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create",
  workItem = null,
}: CreateWorkItemModalProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [testCases, setTestCases] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const isEditing = mode === "edit" && !!workItem;

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
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
          if (tcRes.ok) setTestCases(await tcRes.json());
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

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl border border-outline-variant w-full max-w-lg flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-bold text-on-surface">
            {isEditing ? "Edit Work Item" : "New Work Item"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-label-md font-bold text-on-surface mb-1">Title <span className="text-error">*</span></label>
            <input
              {...register("title", { required: "Title is required", minLength: 2 })}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="e.g., Run regression tests for auth module"
            />
            {errors.title && <p className="text-error text-body-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Type</label>
              <select
                {...register("type")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
              >
                <option value="Task">Task</option>
                <option value="Test Case">Testing (Test Case)</option>
                <option value="Defect">Regression Test (Defect)</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Priority</label>
              <select
                {...register("priority")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Status</label>
              <select
                {...register("status")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Progress</label>
              <input
                {...register("progress", { valueAsNumber: true, min: 0, max: 100 })}
                type="number"
                min={0}
                max={100}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {selectedType === "Test Case" && (
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Select Test Case</label>
              {isLoadingRelated ? (
                <div className="flex items-center gap-2 text-body-sm text-outline px-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading test cases...
                </div>
              ) : (
                <select
                  {...register("testCaseId", { required: "Test case is required for testing" })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
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
              <label className="block text-label-md font-bold text-on-surface mb-1">Select Defect for Regression</label>
              {isLoadingRelated ? (
                <div className="flex items-center gap-2 text-body-sm text-outline px-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading defects...
                </div>
              ) : (
                <select
                  {...register("defectId", { required: "Defect is required for regression test" })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
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
              <label className="block text-label-md font-bold text-on-surface mb-1">Assignee</label>
              <select
                {...register("assignedTo")}
                className="w-full bg-surface-container-low text-on-surface-variant border border-outline-variant rounded-xl px-4 py-2 text-body-md appearance-none opacity-80 cursor-not-allowed"
                disabled
              >
                <option value={session?.user?.name || ""}>{session?.user?.name || "Current User"}</option>
                <option value="other" disabled>Assign to another PIC (Coming soon)</option>
              </select>
            </div>
            <div>
              <label className="block text-label-md font-bold text-on-surface mb-1">Due In</label>
              <input
                {...register("dueIn")}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="e.g. 3 days"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant mt-6">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {isEditing ? "Saving..." : "Creating..."}</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> {isEditing ? "Save Changes" : "Create Work Item"}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
