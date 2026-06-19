"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ScenarioForm, type ScenarioFormValues } from "@/components/test-cases/scenario-form";

export default function CreateScenarioPage() {
  const router = useRouter();

  const handleSubmit = async (payload: ScenarioFormValues) => {
    const response = await fetch("/api/test-cases/scenarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.title,
        description: payload.description,
        moduleId: payload.moduleId,
        subModuleId: payload.subModuleId || null,
        type: payload.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create scenario");
    }

    router.push(`/test-cases/scenarios?toast=created`);
  };

  return (
    <PageContainer>
      <ScenarioForm
        mode="create"
        title="Create Scenario"
        subtitle="Define a new scenario grouping for your test cases"
        backHref="/test-cases/scenarios"
        backLabel="Back to Scenarios"
        submitLabel="Create Scenario"
        onCancel={() => router.push("/test-cases/scenarios")}
        onSubmit={handleSubmit}
      />
    </PageContainer>
  );
}
