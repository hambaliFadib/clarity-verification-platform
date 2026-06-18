"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ModuleForm, type ModuleFormValues } from "@/components/test-cases/module-form";
import type { ModuleNode } from "@/components/test-cases/module-item";
import Link from "next/link";

export default function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [moduleData, setModuleData] = useState<ModuleNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock API call to fetch module
    let isMounted = true;
    setTimeout(() => {
      if (!isMounted) return;
      setModuleData({
        id,
        displayId: id,
        name: "Authentication",
        description: "User login, registration, password reset and sessions.",
        testCaseCount: 15,
        scenarioCount: 3,
        passRate: 85,
        status: "Active",
      });
      setIsLoading(false);
    }, 500);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const initialValues = useMemo<Partial<ModuleFormValues> | undefined>(() => {
    if (!moduleData) return undefined;
    return {
      title: moduleData.name,
      description: moduleData.description || "",
      parentModule: "", // Mock pre-filled
    };
  }, [moduleData]);

  const handleSubmit = async (payload: ModuleFormValues) => {
    // Mock API call to update module
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Updating module:", id, payload);
    router.push(`/test-cases/modules?toast=updated`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading module for editing...</div>
      </div>
    );
  }

  if (!moduleData || !initialValues) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Module Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          The module "{id}" does not exist.
        </p>
        <Link href="/test-cases/modules" className="text-primary-container hover:underline mt-4 inline-block">
          Back to Modules
        </Link>
      </div>
    );
  }

  return (
    <PageContainer>
      <ModuleForm
        mode="edit"
        title="Edit Module"
        subtitle={`Modifying module ${id}`}
        backHref="/test-cases/modules"
        backLabel="Back to Modules"
        submitLabel="Save Changes"
        initialValues={initialValues}
        onCancel={() => router.push("/test-cases/modules")}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
