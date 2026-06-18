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
      parentModule: parentId ? `Module ${parentId}` : "",
    };
  }, [parentId]);

  const handleSubmit = async (payload: ModuleFormValues) => {
    // Mock API call to create module
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Creating module:", payload);
    router.push(`/test-cases/modules?toast=created`);
  };

  return (
    <ModuleForm
      mode="create"
      title="Create Module"
      subtitle="Define a new module or sub-module to organize test cases"
      backHref="/test-cases/modules"
      backLabel="Back to Modules"
      submitLabel="Create Module"
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
