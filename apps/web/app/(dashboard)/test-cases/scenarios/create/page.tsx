"use client";

import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ScenarioForm, type ScenarioFormValues } from "@/components/test-cases/scenario-form";

export default function CreateScenarioPage() {
  const router = useRouter();

  const handleSubmit = async (payload: ScenarioFormValues) => {
    // Mock API call to create scenario
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Creating scenario:", payload);
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
