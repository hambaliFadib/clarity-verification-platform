"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { Combobox } from "@/components/ui/combobox";
import { ArrowLeft, Save, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/ui/alert-modal";

export interface ScenarioFormValues {
  title: string;
  description: string;
  module: string;
  subModule: string;
}

interface ScenarioFormProps {
  mode: "create" | "edit";
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  submitLabel: string;
  initialValues?: Partial<ScenarioFormValues>;
  onCancel: () => void;
  onSubmit: (payload: ScenarioFormValues) => Promise<void>;
}

const inputClass =
  "w-full border border-outline-variant rounded-lg px-4 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all";
const labelClass =
  "block text-label-bold font-label-bold text-on-surface-variant uppercase tracking-normal mb-1.5";

const DEFAULT_VALUES: ScenarioFormValues = {
  title: "",
  description: "",
  module: "",
  subModule: "",
};

export function ScenarioForm({
  mode,
  title,
  subtitle,
  backHref,
  backLabel,
  submitLabel,
  initialValues,
  onCancel,
  onSubmit,
}: ScenarioFormProps) {
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [subModuleOptions, setSubModuleOptions] = useState<string[]>([]);

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

  const defaultValues = useMemo(() => ({ ...DEFAULT_VALUES, ...initialValues }), [initialValues]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ScenarioFormValues>({
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/test-cases/modules")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!isMounted) return;
        setModuleOptions(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err));

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCancel = () => {
    if (isDirty && !confirm("Are you sure you want to discard your changes?")) {
      return;
    }
    onCancel();
  };

  const submitForm = async (data: ScenarioFormValues) => {
    try {
      await onSubmit(data);
    } catch (err: any) {
      setAlertState({
        isOpen: true,
        title: mode === "create" ? "Creation Failed" : "Update Failed",
        message: err.message || "An error occurred",
        type: "error",
      });
    }
  };

  const formId = `${mode}-scenario-form`;

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

        <form id={formId} onSubmit={handleSubmit(submitForm)} className="space-y-6">
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={handleCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form={formId} loading={isSubmitting}>
                  <Save className="h-4 w-4" /> {submitLabel}
                </Button>
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-6 max-w-4xl">
            <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-5 shadow-subtle flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/30">
                  <Info className="h-4 w-4 text-primary" />
                  <h2 className="text-label-bold font-label-bold text-outline uppercase tracking-normal">
                    Scenario Details
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Login Flow Scenario"
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

                  <div>
                    <label className={labelClass}>Module *</label>
                    <Controller
                      control={control}
                      name="module"
                      rules={{ required: "Module is required" }}
                      render={({ field }) => (
                        <Combobox
                          value={field.value}
                          onChange={field.onChange}
                          options={moduleOptions}
                          placeholder="e.g. Authentication, Project Management"
                          error={!!errors.module}
                        />
                      )}
                    />
                    {errors.module && (
                      <span className="text-body-sm text-error mt-1 block" role="alert">
                        {errors.module.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Sub-Module</label>
                    <Controller
                      control={control}
                      name="subModule"
                      render={({ field }) => (
                        <Combobox
                          value={field.value || ""}
                          onChange={field.onChange}
                          options={subModuleOptions}
                          placeholder="e.g. Login Flow, Sign Up"
                          error={!!(errors as any).subModule}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      placeholder="Scope, purpose, or short context for this scenario..."
                      className={`${inputClass} min-h-[90px] resize-y`}
                      {...register("description")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
