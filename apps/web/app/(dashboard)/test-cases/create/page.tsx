"use client";

import { useState, useEffect } from "react";
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

interface FormStep {
  id: string;
  order: number;
  action: string;
  testData: string;
}

interface FormValues {
  title: string;
  description: string;
  module: string;
  type: "Functional" | "UI" | "Performance" | "Integration" | "Security";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Draft" | "Ready" | "Approved" | "In Review";
  complexity: "Simple" | "Medium" | "Complex" | "";
  assignedTo: string;
  requirementId: string;
  estimatedTime: string;
  environment: "Staging" | "Production" | "UAT" | "Development" | "";
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

export default function CreateTestCasePage() {
  const router = useRouter();
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<FormValues | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setIsLoadingUsers(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoadingUsers(false);
      });
  }, []);

  const generateStepId = () => {
    return "step-" + Math.random().toString(36).substring(2, 9);
  };

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      description: "",
      module: "",
      type: "Functional",
      priority: "Medium",
      status: "Draft",
      complexity: "",
      assignedTo: "",
      requirementId: "",
      estimatedTime: "",
      environment: "",
      automationStatus: "",
      preconditions: "",
      testSteps: [{ id: "step-1", order: 1, action: "", testData: "" }],
      expectedResult: "",
      notes: "",
    },
    mode: "onBlur",
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "testSteps",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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

  const handleCancel = () => {
    if (isDirty) {
      if (confirm("Are you sure you want to discard your changes?")) {
        router.push("/test-cases");
      }
    } else {
      router.push("/test-cases");
    }
  };

  const handlePreview = () => {
    setPreviewData(getValues());
    setIsPreviewOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        tags,
        testSteps: data.testSteps.map((step, idx) => ({
          id: step.id || `step-${idx + 1}`,
          order: idx + 1,
          action: step.action.trim(),
          testData: step.testData.trim(),
        })),
      };

      const response = await fetch("/api/test-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create test case");
      }

      showToast("Test case created successfully!", "success");
      
      setTimeout(() => {
        router.push(`/test-cases/${result.testCase.id}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "An error occurred", "error");
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

  return (
    <div className="p-6 space-y-6 animate-fade-in w-full pb-20">
      <Link
        href="/test-cases"
        className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Test Cases
      </Link>

      {toast && (
        <div
          role="alert"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border animate-fade-in ${
            toast.type === "success"
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-red-500 text-white border-red-400"
          }`}
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-body-sm font-medium">{toast.message}</span>
        </div>
      )}

      <form
        id="create-test-case-form"
        onSubmit={handleSubmit(onSubmit, onError)}
        className="space-y-6"
      >
        <PageHeader
          title="Create test case"
          subtitle="Redesign form layout with dynamic execution step fields"
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
              <Button
                variant="outline"
                type="button"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                Preview
              </Button>
              <Button type="submit" form="create-test-case-form" loading={isSubmitting}>
                <Save className="h-4 w-4" /> Save
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Priority *</label>
                    <div className="relative">
                      <select
                        className={`${inputClass} appearance-none pr-10`}
                        {...register("priority", { required: "Priority is required" })}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
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

                  <div>
                    <label className={labelClass}>Complexity</label>
                    <div className="relative">
                      <select className={`${inputClass} appearance-none pr-10`} {...register("complexity")}>
                        <option value="">Select complexity</option>
                        <option value="Simple">Simple</option>
                        <option value="Medium">Medium</option>
                        <option value="Complex">Complex</option>
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
                          <option value="Development">Development</option>
                          <option value="Staging">Staging</option>
                          <option value="UAT">UAT</option>
                          <option value="Production">Production</option>
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
              onClick={() => append({ id: generateStepId(), order: fields.length + 1, action: "", testData: "" })}
            >
              <Plus className="h-3.5 w-3.5" /> Add Step
            </Button>
          </div>

          <div className="hidden md:flex gap-3 px-10 text-[11px] font-bold text-outline uppercase tracking-wider mb-2">
            <div className="flex-1">Action *</div>
            <div className="flex-1">Test Data</div>
            <div className="w-24"></div>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant flex-shrink-0 mt-1.5">
                  {index + 1}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
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
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="e.g. admin@clarity.io / P@ssw0rd"
                      className={inputClass}
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
          <Button
            variant="outline"
            type="button"
            onClick={handlePreview}
            disabled={isSubmitting}
          >
            Preview
          </Button>
          <Button type="submit" loading={isSubmitting}>
            <Save className="h-4 w-4" /> Save Test Case
          </Button>
        </div>
      </form>

      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-label-bold text-outline uppercase tracking-normal">Read-Only View</span>
                <h3 className="text-headline-sm font-headline font-semibold text-on-surface">
                  Test Case Preview
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-on-surface">
              <div>
                <span className="text-[11px] font-mono text-outline">CLR-TC-NEW (Simulated)</span>
                <h1 className="text-headline-md font-headline font-semibold mt-1">
                  {previewData.title || "Untitled Test Case"}
                </h1>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="medium">{previewData.status || "Draft"}</Badge>
                  <Badge variant="medium">{previewData.priority || "Medium"}</Badge>
                  <Badge variant="medium">{previewData.type || "Functional"}</Badge>
                  {previewData.complexity && <Badge variant="outline">{previewData.complexity}</Badge>}
                  {previewData.environment && <Badge variant="outline">{previewData.environment}</Badge>}
                  {previewData.automationStatus && (
                    <Badge variant="outline">{previewData.automationStatus}</Badge>
                  )}
                </div>
              </div>

              {previewData.description && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                  <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                    Description
                  </h4>
                  <p className="text-body-md whitespace-pre-wrap">{previewData.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Module", value: previewData.module || "N/A" },
                  {
                    label: "Assigned To",
                    value:
                      users.find((u) => u.id === previewData.assignedTo)?.name ||
                      previewData.assignedTo ||
                      "Unassigned",
                  },
                  { label: "Requirement", value: previewData.requirementId || "None" },
                  { label: "Estimated Time", value: previewData.estimatedTime || "N/A" },
                ].map((item) => (
                  <div key={item.label} className="bg-surface-container-low/50 border border-outline-variant/65 rounded-xl p-4">
                    <div className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-1">
                      {item.label}
                    </div>
                    <div className="text-body-md font-medium">{item.value}</div>
                  </div>
                ))}
              </div>

              {previewData.preconditions && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                  <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                    Preconditions
                  </h4>
                  <p className="text-body-md whitespace-pre-wrap">{previewData.preconditions}</p>
                </div>
              )}

              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
                <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant flex items-center justify-between">
                  <span className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                    Execution Steps
                  </span>
                  <span className="text-body-xs font-medium text-on-surface-variant">
                    {previewData.testSteps.length} steps total
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low/30 border-b border-outline-variant text-[11px] font-bold text-outline uppercase tracking-normal">
                      <th className="text-left px-4 py-2.5 w-16">#</th>
                      <th className="text-left px-4 py-2.5">Action</th>
                      <th className="text-left px-4 py-2.5 w-1/3">Test Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {previewData.testSteps.map((step, idx) => (
                      <tr key={step.id || idx} className="hover:bg-surface-container-low/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant">
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-body-sm whitespace-pre-wrap">{step.action || "Empty action"}</td>
                        <td className="px-4 py-3 text-body-sm font-mono text-outline bg-surface-container-lowest">
                          {step.testData || <span className="italic text-on-surface-variant/40">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                  Expected Result
                </h4>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5">
                  <p className="text-body-md whitespace-pre-wrap">{previewData.expectedResult || "No expected result specified."}</p>
                </div>
              </div>

              {previewData.notes && (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
                  <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                    Reviewer Notes
                  </h4>
                  <p className="text-body-md whitespace-pre-wrap">{previewData.notes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex justify-end gap-2 flex-shrink-0">
              <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
                Dismiss
              </Button>
              <Button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleSubmit(onSubmit, onError)();
                }}
              >
                <Save className="h-4 w-4" /> Save Test Case
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
