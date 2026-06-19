"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ScenarioForm, type ScenarioFormValues } from "@/components/test-cases/scenario-form";
import type { ScenarioNode } from "@/components/test-cases/scenario-item";
import Link from "next/link";

export default function EditScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [scenario, setScenario] = useState<{ id: string; name: string; description?: string; moduleId?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadScenario() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/test-cases/scenarios/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setScenario(data);
          }
        }
      } catch (err) {
        console.error("Error fetching scenario", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadScenario();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const initialValues = useMemo<Partial<ScenarioFormValues> | undefined>(() => {
    if (!scenario) return undefined;
    return {
      title: scenario.name,
      description: scenario.description || "",
      moduleId: scenario.moduleId || "",
    };
  }, [scenario]);

  const handleSubmit = async (payload: ScenarioFormValues) => {
    const response = await fetch(`/api/test-cases/scenarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.title,
        description: payload.description,
        moduleId: payload.moduleId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update scenario");
    }

    router.push(`/test-cases/scenarios?toast=updated`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading scenario for editing...</div>
      </div>
    );
  }

  if (!scenario || !initialValues) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Scenario Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          The scenario "{id}" does not exist.
        </p>
        <Link href="/test-cases/scenarios" className="text-primary-container hover:underline mt-4 inline-block">
          Back to Scenarios
        </Link>
      </div>
    );
  }

  return (
    <PageContainer>
      <ScenarioForm
        mode="edit"
        title="Edit Scenario"
        subtitle={`Modifying scenario ${id}`}
        backHref="/test-cases/scenarios"
        backLabel="Back to Scenarios"
        submitLabel="Save Changes"
        initialValues={initialValues}
        onCancel={() => router.push("/test-cases/scenarios")}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
