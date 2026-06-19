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
  const [moduleData, setModuleData] = useState<{ id: string; name: string; description?: string; parentId?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        // Try fetching as a root module first
        let res = await fetch(`/api/test-cases/modules/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setModuleData({
              id: data.id,
              name: data.name,
              description: data.description,
            });
          }
          return;
        }

        // If that fails, try fetching as a sub-module
        res = await fetch(`/api/test-cases/sub-modules/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setModuleData({
              id: data.id,
              name: data.name,
              description: data.description,
              parentId: data.moduleId, // mark as sub-module
            });
          }
          return;
        }

        if (isMounted) {
          setModuleData(null);
        }
      } catch (err) {
        console.error("Error loading module", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const initialValues = useMemo<Partial<ModuleFormValues> | undefined>(() => {
    if (!moduleData) return undefined;
    return {
      title: moduleData.name,
      description: moduleData.description || "",
    };
  }, [moduleData]);

  const handleSubmit = async (payload: ModuleFormValues) => {
    const isSub = Boolean(moduleData?.parentId);
    const endpoint = isSub 
      ? `/api/test-cases/sub-modules/${id}`
      : `/api/test-cases/modules/${id}`;

    const response = await fetch(endpoint, {
      method: "PUT",
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
      throw new Error(errorData.error || "Failed to update module");
    }

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
