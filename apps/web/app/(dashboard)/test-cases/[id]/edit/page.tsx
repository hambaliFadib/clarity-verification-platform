"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  Plus,
  Trash2,
  Tag,
  Info,
  ListTodo,
  UserCheck,
  ChevronDown,
  Settings,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertModal } from "@/components/ui/alert-modal";
import { cn } from "@/lib/utils";

interface FormStep {
  id: string;
  order: number;
  action: string;
  expectedResult?: string;
  testData?: string;
}

interface FormValues {
  title: string;
  description: string;
  module: string;
  type: "Functional" | "UI" | "Performance" | "Integration" | "Security";
  severity: "Minor" | "Major" | "Critical" | "Blocker";
  status: "Draft" | "Ready" | "Approved" | "In Review";
  assignedTo: string;
  requirementId: string;
  estimatedTime: string;
  environment: string;
  automationStatus: "Manual" | "Automated" | "Candidate to Automate" | "";
  preconditions: string;
  testSteps: FormStep[];
  expectedResult: string;
  notes: string;
}

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

export default function EditTestCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingTestCase, setIsLoadingTestCase] = useState(true);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      module: "",
      type: "Functional",
      severity: "Major",
      status: "Draft",
      assignedTo: "",
      requirementId: "",
      estimatedTime: "",
      environment: "",
      automationStatus: "",
      preconditions: "",
      testSteps: [{ id: "step-1", order: 1, action: "" }],
      expectedResult: "",
      notes: "",
    },
    mode: "onBlur",
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "testSteps",
  });

  useEffect(() => {
    // Fetch users and environments first
    Promise.all([
      fetch("/api/users").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/environments").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([userData, envData]) => {
        setUsers(userData);
        setEnvironments(envData);
        setIsLoadingUsers(false);

        // Fetch the test case to edit
        return fetch(`/api/test-cases/${id}`);
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load test case");
        return res.json();
      })
      .then((data) => {
        // Find corresponding user ID by name if needed, since repository returns name
        // (but we added assignedToId as well in previous step!)
        const assignedToValue = data.assignedToId || "";
        
        reset({
          title: data.title || "",
          description: data.description || "",
          module: data.module || "",
          type: data.type || "Functional",
          severity: data.severity || "Major",
          status: data.status || "Draft",
          assignedTo: assignedToValue,
          requirementId: data.requirementId || "",
          estimatedTime: data.estimatedTime || "",
          environment: data.environment || "",
          automationStatus: data.automationStatus || "",
          preconditions: data.preconditions || "",
          testSteps: data.steps && data.steps.length > 0
            ? data.steps.map((s: any, idx: number) => ({
                id: s.id || `step-${idx + 1}`,
                order: s.stepNumber || idx + 1,
                action: s.action || "",
                expectedResult: s.expectedResult || "",
                testData: s.testData || "",
              }))
            : [{ id: "step-1", order: 1, action: "" }],
          expectedResult: data.expectedResult || "",
          notes: data.notes || "",
        });

        if (data.tags) {
          setTags(data.tags);
        }
        setIsLoadingTestCase(false);
      })
      .catch((err) => {
        console.error(err);
        showToast("Error loading test case details", "error");
        setIsLoadingTestCase(false);
      });
  }, [id, reset]);

  const generateStepId = () => {
    return "step-" + Math.random().toString(36).substring(2, 9);
  };

  const showToast = (message: string, type: "success" | "error") => {
    setAlertState({
      isOpen: true,
      title: type === "success" ? "Success" : "Error",
      message,
      type,
    });
  };

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/test-cases/${id}`);
    }
  };

  const addTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput("");
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        tags,
        testSteps: data.testSteps.map((step, idx) => ({
          order: idx + 1,
          action: step.action.trim(),
          expectedResult: step.expectedResult?.trim() || undefined,
          testData: step.testData?.trim() || undefined,
        })),
      };

      const response = await fetch(`/api/test-cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update test case");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("test-case-toast", "updated");
      }
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push(`/test-cases/${id}`);
      }
    } catch (err: any) {
      console.error(err);
      setAlertState({
        isOpen: true,
        title: "Update Failed",
        message: err.message || "An error occurred",
        type: "error",
      });
    }
  };

  const onError = (formErrors: any) => {
    const errorFields = Object.keys(formErrors);
    if (errorFields.length > 0) {
      const firstField = errorFields[0];
      
      if (firstField === "testSteps" && Array.isArray(formErrors.testSteps)) {
        const firstStepErrorIdx = formErrors.testSteps.findIndex((step: any) => step);
        if (firstStepErrorIdx !== -1) {
          const element = document.getElementsByName(`testSteps.${firstStepErrorIdx}.action`)[0];
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.focus({ preventScroll: true });
            return;
          }
        }
      }

      const element = document.getElementsByName(firstField)[0];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus({ preventScroll: true });
      }
    }
  };

  if (isLoadingTestCase) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading test case for editing...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in w-full pb-20">
      <Link
        href={`/test-cases/${id}`}
        className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Test Case Details
      </Link>

      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
      />

      <form
        id="edit-test-case-form"
        onSubmit={handleSubmit(onSubmit, onError)}
        className="space-y-6"
      >
        <PageHeader
          title="Edit Test Case"
          subtitle={`Modifying details for test case ${id}`}
          actions={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" form="edit-test-case-form" loading={isSubmitting}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5 shadow-subtle flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
                <Info className="h-4 w-4 text-primary" />
                <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                  Basic Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Verify password requirements on sign up"
                    className={`${inputClass} ${
                      errors.title ? "border-error focus:border-error focus:ring-error/20" : ""
                    }`}
                    {...register("title", {
                      required: "Title is required",
                      minLength: { value: 5, message: "Title must be at least 5 characters" },
                    })}
                  />
                  {errors.title && (
                    <span className="text-body-sm text-error mt-1 block" role="alert">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Module *</label>
                    <input
                      type="text"
                      placeholder="e.g. Authentication, Project Management"
                      className={`${inputClass} ${
                        errors.module ? "border-error focus:border-error focus:ring-error/20" : ""
                      }`}
                      {...register("module", { required: "Module is required" })}
                    />
                    {errors.module && (
                      <span className="text-body-sm text-error mt-1 block" role="alert">
                        {errors.module.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Type *</label>
                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        {...register("type", { required: "Type is required" })}
                      >
                        <option value="Functional">Functional</option>
                        <option value="UI">UI</option>
                        <option value="Performance">Performance</option>
                        <option value="Integration">Integration</option>
                        <option value="Security">Security</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Severity *</label>
                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        {...register("severity", { required: "Severity is required" })}
                      >
                        <option value="Blocker">Blocker</option>
                        <option value="Critical">Critical</option>
                        <option value="Major">Major</option>
                        <option value="Minor">Minor</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Status *</label>
                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        {...register("status", { required: "Status is required" })}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Ready">Ready</option>
                        <option value="Approved">Approved</option>
                        <option value="In Review">In Review</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    placeholder="Scope, tujuan, atau konteks singkat test case ini..."
                    className={`${inputClass} min-h-[90px] resize-y`}
                    {...register("description")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5 shadow-subtle flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
                <UserCheck className="h-4 w-4 text-primary" />
                <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                  Assignment & Tracking
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Assigned To</label>
                  <div className="relative">
                    <select
                      className={`${inputClass} appearance-none pr-10`}
                      disabled={isLoadingUsers}
                      {...register("assignedTo")}
                    >
                      <option value="">
                        {isLoadingUsers ? "Loading users..." : "Unassigned"}
                      </option>
                      {users.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Requirement ID</label>
                    <input
                      type="text"
                      placeholder="e.g. REQ-AUTH-001"
                      className={inputClass}
                      {...register("requirementId")}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Estimated Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10 min, 1h"
                      className={inputClass}
                      {...register("estimatedTime")}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant/60" />
                      <input
                        type="text"
                        placeholder="Type tag and press Enter or click Add"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={addTag}>
                      Add
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-3 bg-surface-container-lowest border border-outline-variant/50 rounded-lg p-3">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-error-container hover:text-on-error-container hover:border-error/30 transition-all gap-1 pl-2.5 group"
                          onClick={() => handleRemoveTag(tag)}
                          title="Click to remove tag"
                        >
                          {tag}
                          <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-error ml-0.5">
                            ×
                          </span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-outline-variant/30 space-y-4">
                  <div className="flex items-center gap-2 pb-1">
                    <Settings className="h-4 w-4 text-primary" />
                    <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                      Execution Setup
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Environment</label>
                      <div className="relative">
                        <select className={`${inputClass} appearance-none pr-10`} {...register("environment")}>
                          <option value="">Select environment</option>
                          {environments.map((env) => (
                            <option key={env.id} value={env.name}>
                              {env.name} ({env.type})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Automation Status</label>
                      <div className="relative">
                        <select
                          className={`${inputClass} appearance-none pr-10`}
                          {...register("automationStatus")}
                        >
                          <option value="">Select status</option>
                          <option value="Manual">Manual</option>
                          <option value="Automated">Automated</option>
                          <option value="Candidate to Automate">Candidate to Automate</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-on-surface-variant/80" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 shadow-subtle">
          <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
              Preconditions
            </h2>
          </div>
          <div>
            <textarea
              placeholder="Tuliskan kondisi yang harus terpenuhi sebelum test dijalankan..."
              className={`${inputClass} min-h-[80px] resize-y`}
              {...register("preconditions")}
            />
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              State sistem, data yang diperlukan, atau environment yang harus aktif
            </p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5 shadow-subtle">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                Test Steps
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: generateStepId(), order: fields.length + 1, action: "" })}
            >
              <Plus className="h-3.5 w-3.5" /> Add Step
            </Button>
          </div>

          <div className="hidden md:flex gap-3 px-10 text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
            <div className="flex-1">Action *</div>
            <div className="w-24"></div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant flex-shrink-0 mt-1.5">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={`Step ${index + 1} Action (e.g. Navigate to /login)*`}
                      className={`${inputClass} ${
                        errors.testSteps?.[index]?.action
                          ? "border-error focus:border-error focus:ring-error/20"
                          : ""
                      }`}
                      {...register(`testSteps.${index}.action` as const, {
                        required: "Step action is required",
                      })}
                    />
                    {errors.testSteps?.[index]?.action && (
                      <span className="text-body-sm text-error mt-1 block" role="alert">
                        {errors.testSteps[index].action.message}
                      </span>
                    )}
                    <textarea
                      placeholder="Expected result for this step (optional)"
                      rows={1}
                      className={`${inputClass} min-h-[38px] py-1.5 text-on-surface-variant/90 border-outline-variant/60 focus:border-primary/50`}
                      {...register(`testSteps.${index}.expectedResult` as const)}
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Test data for this step (optional)"
                      rows={2}
                      className={`${inputClass} min-h-[82px] py-1.5 text-on-surface-variant/90 border-outline-variant/60 focus:border-primary/50`}
                      {...register(`testSteps.${index}.testData` as const)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label="Move step up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label="Move step down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-error hover:bg-error/5"
                      onClick={() => remove(index)}
                      aria-label="Delete step"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 shadow-subtle">
          <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
              Expected Result
            </h2>
          </div>
          <div>
            <textarea
              placeholder="e.g. User is logged in and redirected to dashboard"
              className={`${inputClass} min-h-[90px] resize-y ${
                errors.expectedResult ? "border-error focus:border-error focus:ring-error/20" : ""
              }`}
              {...register("expectedResult", {
                required: "Expected Result is required",
                minLength: { value: 10, message: "Expected Result must be at least 10 characters" },
              })}
            />
            {errors.expectedResult && (
              <span className="text-body-sm text-error mt-1 block" role="alert">
                {errors.expectedResult.message}
              </span>
            )}
            <p className="text-[11px] text-on-surface-variant/80 mt-1">
              Deskripsikan output yang terverifikasi secara sistem, bukan hanya yang terlihat di UI
            </p>
          </div>
        </div>

        <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 shadow-subtle">
          <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
            <HelpCircle className="h-4 w-4 text-primary" />
            <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
              Notes
            </h2>
          </div>
          <div>
            <textarea
              placeholder="Catatan tambahan, ambiguitas, atau konteks untuk reviewer..."
              className={`${inputClass} min-h-[90px] resize-y`}
              {...register("notes")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
