"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  TestCaseForm,
  type TestCaseFormSubmitPayload,
} from "@/components/test-cases/test-case-form";

function CreateTestCaseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const scenarioId = searchParams.get("scenarioId");

  const handleSubmit = async (payload: TestCaseFormSubmitPayload) => {
    const response = await fetch("/api/test-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to create test case");
    }

    router.push(`/test-cases/${result.testCase.id}?toast=created`);
  };

  // We map moduleId and scenarioId to the respective inputs.
  const initialValues = {
    module: moduleId || (scenarioId ? "Authentication" : ""),
    subModule: scenarioId ? "Login Flow" : "",
    scenario: scenarioId ? "Login Scenario" : "",
  };

  return (
    <TestCaseForm
      mode="create"
      title="Create test case"
      subtitle="Single input hub for reusable, traceable execution assets"
      backHref="/test-cases"
      backLabel="Back to Test Cases"
      submitLabel="Save Test Case"
      showPreview
      initialValues={initialValues}
      onCancel={() => router.push("/test-cases")}
      onSubmit={handleSubmit}
    />
  );
}

export default function CreateTestCasePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTestCaseForm />
    </Suspense>
  );
}
