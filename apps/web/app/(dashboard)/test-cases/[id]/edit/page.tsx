"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TestCaseForm,
  type TestCaseFormSubmitPayload,
  type TestCaseFormValues,
} from "@/components/test-cases/test-case-form";
import type { TestCase } from "@/lib/types";

function mapTestCaseToFormValues(testCase: TestCase): Partial<TestCaseFormValues> {
  return {
    title: testCase.title || "",
    description: testCase.description || "",
    moduleId: testCase.moduleId || "",
    subModuleId: testCase.subModuleId || "",
    scenarioId: testCase.scenarioId || "",
    type: testCase.type || "Functional",
    severity: testCase.severity || "Major",
    status: testCase.status || "Draft",
    category: testCase.category || "Positive",
    assignedTo: testCase.assignedToId || "",
    requirementId: testCase.requirementId || "",
    estimatedTime: testCase.estimatedTime || "",
    environment: testCase.environment || "",
    automationStatus: testCase.automationStatus || "",
    preconditions: testCase.preconditions || "",
    testSteps:
      testCase.steps && testCase.steps.length > 0
        ? testCase.steps.map((step, index) => ({
            id: step.id || `step-${index + 1}`,
            order: step.stepNumber || index + 1,
            action: step.action || "",
            expectedResult: step.expectedResult || "",
            testData: step.testData || "",
          }))
        : [{ id: "step-1", order: 1, action: "" }],
    expectedResult: testCase.expectedResult || "",
    notes: testCase.notes || "",
  };
}

export default function EditTestCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/test-cases/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load test case");
        return res.json();
      })
      .then((data: TestCase) => {
        if (!isMounted) return;
        setTestCase(data);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err.message || "Error loading test case details");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const initialValues = useMemo(
    () => (testCase ? mapTestCaseToFormValues(testCase) : undefined),
    [testCase],
  );

  const handleSubmit = async (payload: TestCaseFormSubmitPayload) => {
    const response = await fetch(`/api/test-cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Failed to update test case");
    }

    router.replace(`/test-cases/${id}?toast=updated`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
        <div className="text-body-sm text-outline">Loading test case for editing...</div>
      </div>
    );
  }

  if (error || !testCase || !initialValues) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Test Case Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">
          {error || `The test case "${id}" does not exist.`}
        </p>
        <Link href="/test-cases" className="text-primary-container hover:underline mt-4 inline-block">
          Back to Test Cases
        </Link>
      </div>
    );
  }

  return (
    <TestCaseForm
      mode="edit"
      title="Edit Test Case"
      subtitle={`Modifying reusable source data for ${id}`}
      backHref={`/test-cases/${id}`}
      backLabel="Back to Test Case Details"
      submitLabel="Save Changes"
      initialValues={initialValues}
      onCancel={() => router.replace(`/test-cases/${id}`)}
      onSubmit={handleSubmit}
    />
  );
}
