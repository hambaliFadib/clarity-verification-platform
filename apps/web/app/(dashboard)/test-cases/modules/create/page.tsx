"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ModuleForm, type ModuleFormValues } from "@/components/test-cases/module-form";
import { Suspense, useMemo } from "react";

function CreateModuleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams?.get("parentId");

  const initialValues = useMemo<Partial<ModuleFormValues>>(() => {
    return {
      title: "",
      description: "",
    };
  }, []);

  const handleSubmit = async (payload: ModuleFormValues) => {
    const url = parentId
      ? `/api/test-cases/modules/${parentId}/sub-modules`
      : `/api/test-cases/modules`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.title,
        description: payload.description,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create module or sub-module");
    }

    router.push(`/test-cases/modules?toast=created`);
  };

  return (
    <ModuleForm
      mode="create"
      title={parentId ? "Create Sub-Module" : "Create Module"}
      subtitle={parentId ? "Define a new sub-module for this parent module" : "Define a new module to organize test cases"}
      backHref="/test-cases/modules"
      backLabel="Back to Modules"
      submitLabel="Create"
      initialValues={initialValues}
      onCancel={() => router.push("/test-cases/modules")}
      onSubmit={handleSubmit}
    />
  );
}

export default function CreateModulePage() {
  return (
    <PageContainer>
      <Suspense fallback={<div className="p-6 text-center text-outline">Loading...</div>}>
        <CreateModuleForm />
      </Suspense>
    </PageContainer>
  );
}
