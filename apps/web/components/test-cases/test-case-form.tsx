"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  Plus,
  Trash2,
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
import type {
  Environment,
  TeamMember,
  TestCaseSeverity,
  TestCasePriority,
  TestCaseStatus,
  TestCaseType,
  TcModule,
  TcSubModule,
  TcScenario,
} from "@/lib/types";

export interface TestCaseFormStep {
  id: string;
  order: number;
  action: string;
  expectedResult?: string;
  testData?: string;
}

export interface TestCaseFormValues {
  title: string;
  description: string;
  moduleId: string;
  subModuleId: string;
  scenarioId: string;
  type: TestCaseType;
  severity: TestCaseSeverity;
  status: TestCaseStatus;
  category: "Positive" | "Negative";
  assignedTo: string;
  requirementId: string;
  estimatedTime: string;
  environment: string;
  automationStatus: "Manual" | "Automated" | "Candidate to Automate" | "";
  preconditions: string;
  testSteps: TestCaseFormStep[];
  expectedResult: string;
  notes: string;
  priority: TestCasePriority;
  actualResult: string;
  releaseVersion: string;
  isAutomated: boolean;
  author: string;
}

export interface TestCaseFormSubmitPayload extends TestCaseFormValues {
  testSteps: TestCaseFormStep[];
}

interface TestCaseFormProps {
  mode: "create" | "edit";
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  submitLabel: string;
  initialValues?: Partial<TestCaseFormValues>;
  showPreview?: boolean;
  onCancel: () => void;
  onSubmit: (payload: TestCaseFormSubmitPayload) => Promise<void>;
}

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

const DEFAULT_VALUES: TestCaseFormValues = {
  title: "",
  description: "",
  moduleId: "",
  subModuleId: "",
  scenarioId: "",
  type: "Functional",
  severity: "Major",
  status: "Draft",
  category: "Positive",
  assignedTo: "",
  requirementId: "",
  estimatedTime: "",
  environment: "",
  automationStatus: "",
  preconditions: "",
  testSteps: [{ id: "step-1", order: 1, action: "" }],
  expectedResult: "",
  notes: "",
  priority: "Medium",
  actualResult: "",
  releaseVersion: "",
  isAutomated: false,
  author: "",
};

const TEST_CASE_TYPES: TestCaseType[] = [
  "Functional",
  "Regression",
  "Smoke",
  "Integration",
  "UI",
  "Performance",
  "Security",
];

const TEST_CASE_SEVERITIES: TestCaseSeverity[] = [
  "Blocker",
  "Critical",
  "Major",
  "Minor",
];

const TEST_CASE_STATUSES: TestCaseStatus[] = [
  "Draft",
  "Ready",
  "In Review",
  "Approved",
  "Obsolete",
];

function generateStepId() {
  return `step-${Math.random().toString(36).substring(2, 9)}`;
}

function mergeInitialValues(initialValues?: Partial<TestCaseFormValues>): TestCaseFormValues {
  return {
    ...DEFAULT_VALUES,
    ...initialValues,
    testSteps:
      initialValues?.testSteps && initialValues.testSteps.length > 0
        ? initialValues.testSteps
        : DEFAULT_VALUES.testSteps,
  };
}

export function TestCaseForm({
  mode,
  title,
  subtitle,
  backHref,
  backLabel,
  submitLabel,
  initialValues,
  showPreview = false,
  onCancel,
  onSubmit,
}: TestCaseFormProps) {
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [modules, setModules] = useState<TcModule[]>([]);
  const [subModules, setSubModules] = useState<TcSubModule[]>([]);
  const [scenarios, setScenarios] = useState<TcScenario[]>([]);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(true);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<TestCaseFormValues | null>(null);
  const [expandedPreviewSteps, setExpandedPreviewSteps] = useState<Record<number, boolean>>({});
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

  const defaultValues = useMemo(() => mergeInitialValues(initialValues), [initialValues]);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TestCaseFormValues>({
    defaultValues,
    mode: "onBlur",
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "testSteps",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch("/api/users").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/environments").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/test-cases/modules").then((res) => (res.ok ? res.json() : [])),
      fetch("/api/test-cases/scenarios").then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([userData, envData, moduleData, scenarioData]) => {
        if (!isMounted) return;
        setUsers(Array.isArray(userData) ? userData : []);
        setEnvironments(Array.isArray(envData) ? envData : []);
        setModules(Array.isArray(moduleData) ? moduleData : []);
        setScenarios(Array.isArray(scenarioData) ? scenarioData : []);
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setAlertState({
          isOpen: true,
          title: "Reference Data",
          message: "Some reference data could not be loaded. You can still continue.",
          type: "warning",
        });
      })
      .finally(() => {
        if (isMounted) setIsLoadingReferenceData(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const watchedModuleId = watch("moduleId");
  const watchedSubModuleId = watch("subModuleId");

  useEffect(() => {
    if (!watchedModuleId) {
      setSubModules([]);
      return;
    }

    let isMounted = true;
    fetch(`/api/test-cases/modules/${watchedModuleId}/sub-modules`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return;
        const subMods = Array.isArray(data) ? data : [];
        setSubModules(subMods);
        
        const currentSubModuleId = getValues("subModuleId");
        if (currentSubModuleId && !subMods.some((sm) => sm.id === currentSubModuleId)) {
          setValue("subModuleId", "");
        }
      })
      .catch((err) => console.error(err));

    return () => {
      isMounted = false;
    };
  }, [watchedModuleId, setValue, getValues]);

  const filteredScenarios = useMemo(() => {
    return scenarios.filter((sc) => {
      if (watchedModuleId && sc.moduleId !== watchedModuleId) {
        return false;
      }
      if (watchedSubModuleId) {
        return sc.subModuleId === watchedSubModuleId;
      }
      if (watchedModuleId) {
        return sc.moduleId === watchedModuleId && (!sc.subModuleId || sc.subModuleId === "");
      }
      return false;
    });
  }, [scenarios, watchedModuleId, watchedSubModuleId]);

  useEffect(() => {
    const currentScenarioId = getValues("scenarioId");
    if (currentScenarioId && !filteredScenarios.some((sc) => sc.id === currentScenarioId)) {
      setValue("scenarioId", "");
    }
  }, [filteredScenarios, setValue, getValues]);

  const moduleNames = useMemo(() => modules.map(m => m.name), [modules]);
  const moduleNameToId = useMemo(() => new Map(modules.map(m => [m.name, m.id])), [modules]);
  const moduleIdToName = useMemo(() => new Map(modules.map(m => [m.id, m.name])), [modules]);

  const subModuleNames = useMemo(() => subModules.map(sm => sm.name), [subModules]);
  const subModuleNameToId = useMemo(() => new Map(subModules.map(sm => [sm.name, sm.id])), [subModules]);
  const subModuleIdToName = useMemo(() => new Map(subModules.map(sm => [sm.id, sm.name])), [subModules]);

  const scenarioNames = useMemo(() => filteredScenarios.map(sc => sc.name), [filteredScenarios]);
  const scenarioNameToId = useMemo(() => new Map(scenarios.map(sc => [sc.name, sc.id])), [scenarios]);
  const scenarioIdToName = useMemo(() => new Map(scenarios.map(sc => [sc.id, sc.name])), [scenarios]);



  const handleCancel = () => {
    if (isDirty && !confirm("Are you sure you want to discard your changes?")) {
      return;
    }
    onCancel();
  };

  const handlePreview = () => {
    setPreviewData(getValues());
    setIsPreviewOpen(true);
  };

  const submitForm = async (data: TestCaseFormValues) => {
    const payload: TestCaseFormSubmitPayload = {
      ...data,
      testSteps: data.testSteps.map((step, index) => ({
        id: step.id || `step-${index + 1}`,
        order: index + 1,
        action: step.action.trim(),
        expectedResult: step.expectedResult?.trim() || undefined,
        testData: step.testData?.trim() || undefined,
      })),
    };

    try {
      await onSubmit(payload);
    } catch (err: any) {
      console.error(err);
      setAlertState({
        isOpen: true,
        title: mode === "create" ? "Creation Failed" : "Update Failed",
        message: err.message || "An error occurred",
        type: "error",
      });
    }
  };

  const onError = (formErrors: any) => {
    const errorFields = Object.keys(formErrors);
    if (errorFields.length === 0) return;

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
  };

  const formId = `${mode}-test-case-form`;

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in w-full pb-20">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>

        <AlertModal
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
        />

        <form
          id={formId}
          onSubmit={handleSubmit(submitForm, onError)}
          className="space-y-6"
        >
          <PageHeader
            title={title}
            subtitle={subtitle}
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
                {showPreview && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handlePreview}
                    disabled={isSubmitting}
                  >
                    Preview
                  </Button>
                )}
                <Button type="submit" form={formId} loading={isSubmitting}>
                  <Save className="h-4 w-4" /> {submitLabel}
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
                      className={`h-10 ${inputClass} ${
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
                      <Controller
                        control={control}
                        name="moduleId"
                        rules={{ required: "Module is required" }}
                        render={({ field }) => (
                          <Combobox
                            value={moduleIdToName.get(field.value) || ""}
                            onChange={(name) => {
                              const id = moduleNameToId.get(name) || "";
                              field.onChange(id);
                            }}
                            options={moduleNames}
                            placeholder="Select a module..."
                            error={!!errors.moduleId}
                          />
                        )}
                      />
                      {errors.moduleId && (
                        <span className="text-body-sm text-error mt-1 block" role="alert">
                          {errors.moduleId.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Sub-Module</label>
                      <Controller
                        control={control}
                        name="subModuleId"
                        render={({ field }) => (
                          <Combobox
                            value={subModuleIdToName.get(field.value) || ""}
                            onChange={(name) => {
                              const id = subModuleNameToId.get(name) || "";
                              field.onChange(id);
                            }}
                            options={subModuleNames}
                            placeholder={watchedModuleId ? "Select a sub-module..." : "Select a module first..."}
                            disabled={!watchedModuleId}
                            error={!!errors.subModuleId}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Scenario *</label>
                      <Controller
                        control={control}
                        name="scenarioId"
                        rules={{ required: "Scenario is required" }}
                        render={({ field }) => (
                          <Combobox
                            value={scenarioIdToName.get(field.value) || ""}
                            onChange={(name) => {
                              const id = scenarioNameToId.get(name) || "";
                              field.onChange(id);
                            }}
                            options={scenarioNames}
                            placeholder={watchedModuleId ? "Select a scenario..." : "Select a module first..."}
                            disabled={!watchedModuleId}
                            error={!!errors.scenarioId}
                          />
                        )}
                      />
                      {errors.scenarioId && (
                        <span className="text-body-sm text-error mt-1 block" role="alert">
                          {errors.scenarioId.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className={labelClass}>Type *</label>
                      <Controller
                        control={control}
                        name="type"
                        rules={{ required: "Type is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={TEST_CASE_TYPES}
                            error={!!errors.type}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Severity *</label>
                      <Controller
                        control={control}
                        name="severity"
                        rules={{ required: "Severity is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={TEST_CASE_SEVERITIES}
                            error={!!errors.severity}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Status *</label>
                      <Controller
                        control={control}
                        name="status"
                        rules={{ required: "Status is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={TEST_CASE_STATUSES}
                            error={!!errors.status}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Category *</label>
                      <Controller
                        control={control}
                        name="category"
                        rules={{ required: "Category is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={["Positive", "Negative"]}
                            error={!!errors.category}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Priority *</label>
                      <Controller
                        control={control}
                        name="priority"
                        rules={{ required: "Priority is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onChange={field.onChange}
                            options={["Critical", "High", "Medium", "Low"]}
                            error={!!errors.priority}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      placeholder="Scope, purpose, or short context for this test case..."
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
                    <Controller
                      control={control}
                      name="assignedTo"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                          options={[
                            { label: isLoadingReferenceData ? "Loading users..." : "Unassigned", value: "" },
                            ...users.map(u => ({ label: `${u.name} (${u.role})`, value: u.id }))
                          ]}
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Requirement ID</label>
                      <input
                        type="text"
                        placeholder="e.g. REQ-AUTH-001"
                        className={`h-10 ${inputClass}`}
                        {...register("requirementId")}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Estimated Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 10 min, 1h"
                        className={`h-10 ${inputClass}`}
                        {...register("estimatedTime")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Author</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        className={`h-10 ${inputClass}`}
                        {...register("author")}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Release Version</label>
                      <input
                        type="text"
                        placeholder="e.g. v1.0.0"
                        className={`h-10 ${inputClass}`}
                        {...register("releaseVersion")}
                      />
                    </div>
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
                        <Controller
                          control={control}
                          name="environment"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onChange={field.onChange}
                              options={[
                                { label: "Select environment", value: "" },
                                ...environments.map(env => ({ label: `${env.name} (${env.type})`, value: env.name }))
                              ]}
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Automation Status</label>
                        <Controller
                          control={control}
                          name="automationStatus"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onChange={field.onChange}
                              options={[
                                { label: "Select status", value: "" },
                                { label: "Manual", value: "Manual" },
                                { label: "Automated", value: "Automated" },
                                { label: "Candidate to Automate", value: "Candidate to Automate" }
                              ]}
                            />
                          )}
                        />
                      </div>

                      <div className="flex items-center gap-2 mt-7">
                        <input
                          type="checkbox"
                          id="isAutomated"
                          className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary-container"
                          {...register("isAutomated")}
                        />
                        <label htmlFor="isAutomated" className="text-body-sm font-medium text-on-surface cursor-pointer select-none">
                          Is Automated?
                        </label>
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
                placeholder="Write the system state, data, or environment needed before execution..."
                className={`${inputClass} min-h-[80px] resize-y`}
                {...register("preconditions")}
              />
              <p className="text-[11px] text-on-surface-variant/80 mt-1">
                Required state, data, or active environment before this test can run
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

                  <div className="flex-1 space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder={`Step ${index + 1} Action (e.g. Navigate to /login)*`}
                        className={`h-10 ${inputClass} ${
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <textarea
                        placeholder="Expected result for this step (optional)"
                        rows={2}
                        className={`${inputClass} min-h-[82px] py-1.5 text-on-surface-variant/90 border-outline-variant/60 focus:border-primary/50`}
                        {...register(`testSteps.${index}.expectedResult` as const)}
                      />
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
                Describe the system-verifiable outcome, not only what appears on screen
              </p>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 shadow-subtle">
            <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                Actual Result
              </h2>
            </div>
            <div>
              <textarea
                placeholder="e.g. User is logged in but page is blank"
                className={`${inputClass} min-h-[90px] resize-y`}
                {...register("actualResult")}
              />
              <p className="text-[11px] text-on-surface-variant/80 mt-1">
                Record the actual outcome observed during execution (used for tracking failures)
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
                placeholder="Additional notes, ambiguity, or reviewer context..."
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
            {showPreview && (
              <Button
                variant="outline"
                type="button"
                onClick={handlePreview}
                disabled={isSubmitting}
              >
                Preview
              </Button>
            )}
            <Button type="submit" loading={isSubmitting}>
              <Save className="h-4 w-4" /> {submitLabel}
            </Button>
          </div>
        </form>
      </div>

      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto animate-fade-in">
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
                <span className="text-[11px] font-mono text-outline">
                  {mode === "create" ? "CLR-TC-NEW (Simulated)" : "Current test case"}
                </span>
                <h1 className="text-headline-md font-headline font-semibold mt-1">
                  {previewData.title || "Untitled Test Case"}
                </h1>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="medium">{previewData.status || "Draft"}</Badge>
                  <Badge variant="medium">{previewData.severity || "Major"}</Badge>
                  <Badge variant="medium">{previewData.type || "Functional"}</Badge>
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
                  { label: "Module", value: moduleIdToName.get(previewData.moduleId) || "N/A" },
                  { label: "Sub-Module", value: subModuleIdToName.get(previewData.subModuleId) || "N/A" },
                  { label: "Scenario", value: scenarioIdToName.get(previewData.scenarioId) || "N/A" },
                  {
                    label: "Assigned To",
                    value:
                      users.find((user) => user.id === previewData.assignedTo)?.name ||
                      previewData.assignedTo ||
                      "Unassigned",
                  },
                  { label: "Requirement", value: previewData.requirementId || "None" },
                  { label: "Estimated Time", value: previewData.estimatedTime || "N/A" },
                  { label: "Priority", value: previewData.priority || "Medium" },
                  { label: "Author", value: previewData.author || "N/A" },
                  { label: "Release Version", value: previewData.releaseVersion || "N/A" },
                  { label: "Is Automated", value: previewData.isAutomated ? "Yes" : "No" },
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {previewData.testSteps.map((step, index) => {
                      const stepNumber = index + 1;
                      const hasDetails = Boolean(step.expectedResult || step.testData);
                      const isExpanded = Boolean(expandedPreviewSteps[stepNumber]);

                      return (
                        <tr key={step.id || index} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="px-4 py-3 align-top">
                            <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-label-bold text-on-surface-variant mt-0.5">
                              {stepNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-body-sm text-on-surface align-top">
                            <div
                              className={cn(
                                "flex items-center gap-2 select-none",
                                hasDetails ? "cursor-pointer hover:text-primary transition-colors font-medium" : "",
                              )}
                              onClick={() =>
                                hasDetails &&
                                setExpandedPreviewSteps((prev) => ({
                                  ...prev,
                                  [stepNumber]: !prev[stepNumber],
                                }))
                              }
                            >
                              {hasDetails && (
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 text-on-surface-variant transition-transform flex-shrink-0",
                                    isExpanded ? "" : "-rotate-90",
                                  )}
                                />
                              )}
                              <span>{step.action || "Empty action"}</span>
                            </div>

                            {isExpanded && hasDetails && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                {step.expectedResult && (
                                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-3 space-y-1">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Expected Result</span>
                                    <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap font-mono">
                                      {stepNumber}.1 {step.expectedResult}
                                    </p>
                                  </div>
                                )}
                                {step.testData && (
                                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg p-3 space-y-1">
                                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider block">Test Data</span>
                                    <p className="text-body-sm text-on-surface-variant whitespace-pre-wrap">{step.testData}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                  Expected Result
                </h4>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5">
                  <p className="text-body-md whitespace-pre-wrap">
                    {previewData.expectedResult || "No expected result specified."}
                  </p>
                </div>
              </div>

              {previewData.actualResult && (
                <div>
                  <h4 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-2">
                    Actual Result
                  </h4>
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5">
                    <p className="text-body-md whitespace-pre-wrap">
                      {previewData.actualResult}
                    </p>
                  </div>
                </div>
              )}

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
                  handleSubmit(submitForm, onError)();
                }}
              >
                <Save className="h-4 w-4" /> {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
