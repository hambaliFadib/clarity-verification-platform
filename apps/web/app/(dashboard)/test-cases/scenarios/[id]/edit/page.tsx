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
  const [scenario, setScenario] = useState<ScenarioNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock API call to fetch scenario
    let isMounted = true;
    setTimeout(() => {
      if (!isMounted) return;
      setScenario({
        id,
        displayId: id,
        name: "Login Scenario",
        description: "Verify login functionality",
        testCaseCount: 5,
        passRate: 80,
        status: "Ready",
      });
      setIsLoading(false);
    }, 500);

    return () => {
      isMounted = false;
    };
  }, [id]);

  const initialValues = useMemo<Partial<ScenarioFormValues> | undefined>(() => {
    if (!scenario) return undefined;
    return {
      title: scenario.name,
      description: scenario.description || "",
      module: "Authentication", // Mock pre-filled
      subModule: "Login Flow",  // Mock pre-filled
    };
  }, [scenario]);

  const handleSubmit = async (payload: ScenarioFormValues) => {
    // Mock API call to update scenario
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Updating scenario:", id, payload);
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
