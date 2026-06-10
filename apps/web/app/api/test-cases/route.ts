import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function mapBackendToFrontend(tc: any) {
  return {
    id: tc.display_id,
    realId: tc.id,
    title: tc.title,
    description: tc.description || undefined,
    module: tc.module,
    priority: tc.priority,
    status: tc.status,
    type: tc.type,
    assignedTo: tc.assigned_to_name || undefined,
    createdBy: "Hambali Fadib",
    createdAt: tc.created_at,
    updatedAt: tc.updated_at,
    requirementId: tc.requirement_id || undefined,
    estimatedTime: tc.estimated_time || undefined,
    tags: tc.tags || undefined,
    complexity: tc.complexity || undefined,
    environment: tc.environment || undefined,
    automationStatus: tc.automation_status || undefined,
    preconditions: tc.preconditions || undefined,
    expectedResult: tc.expected_result,
    notes: tc.notes || undefined,
    steps: (tc.steps || []).map((step: any) => ({
      stepNumber: step.step_number,
      action: step.action,
      expectedResult: step.expected_result || "",
      status: step.status || "Not Run",
      actualResult: step.actual_result || undefined,
      id: step.id,
      order: step.step_number,
      testData: step.test_data || undefined,
    })),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const type = searchParams.get("type") || "";
    const skip = searchParams.get("skip") || "0";
    const limit = searchParams.get("limit") || "100";

    const backendUrl = new URL(`${API_URL}/api/v1/test-cases`);
    if (search) backendUrl.searchParams.set("search", search);
    if (status) backendUrl.searchParams.set("status", status);
    if (priority) backendUrl.searchParams.set("priority", priority);
    if (type) backendUrl.searchParams.set("type", type);
    backendUrl.searchParams.set("skip", skip);
    backendUrl.searchParams.set("limit", limit);

    const response = await fetch(backendUrl.toString(), {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch test cases from backend" },
        { status: response.status }
      );
    }

    const totalCount = response.headers.get("X-Total-Count") || "0";
    const data = await response.json();
    const mappedData = data.map(mapBackendToFrontend);

    return NextResponse.json(mappedData, {
      headers: {
        "X-Total-Count": totalCount,
        "Access-Control-Expose-Headers": "X-Total-Count",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const backendPayload = {
      title: payload.title,
      description: payload.description || null,
      module: payload.module,
      type: payload.type,
      priority: payload.priority,
      status: payload.status,
      complexity: payload.complexity || null,
      assigned_to: payload.assignedTo || null,
      requirement_id: payload.requirementId || null,
      estimated_time: payload.estimatedTime || null,
      tags: payload.tags || null,
      environment: payload.environment || null,
      automation_status: payload.automationStatus || null,
      preconditions: payload.preconditions || null,
      expected_result: payload.expectedResult,
      notes: payload.notes || null,
      test_steps: (payload.testSteps || []).map((step: any) => ({
        action: step.action,
        test_data: step.testData || null,
      })),
    };

    const response = await fetch(`${API_URL}/api/v1/test-cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json(
        { success: false, error: errData.detail || "Failed to create test case" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      testCase: mapBackendToFrontend(data),
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
