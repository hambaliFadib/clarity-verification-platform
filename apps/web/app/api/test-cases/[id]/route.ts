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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_URL}/api/v1/test-cases/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Test case not found in backend" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(mapBackendToFrontend(data));
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json();

    const backendPayload: any = {};
    if (payload.title !== undefined) backendPayload.title = payload.title;
    if (payload.description !== undefined) backendPayload.description = payload.description || null;
    if (payload.module !== undefined) backendPayload.module = payload.module;
    if (payload.type !== undefined) backendPayload.type = payload.type;
    if (payload.priority !== undefined) backendPayload.priority = payload.priority;
    if (payload.status !== undefined) backendPayload.status = payload.status;
    if (payload.complexity !== undefined) backendPayload.complexity = payload.complexity || null;
    if (payload.assignedTo !== undefined) backendPayload.assigned_to = payload.assignedTo || null;
    if (payload.requirementId !== undefined) backendPayload.requirement_id = payload.requirementId || null;
    if (payload.estimatedTime !== undefined) backendPayload.estimated_time = payload.estimatedTime || null;
    if (payload.tags !== undefined) backendPayload.tags = payload.tags || null;
    if (payload.environment !== undefined) backendPayload.environment = payload.environment || null;
    if (payload.automationStatus !== undefined) backendPayload.automation_status = payload.automationStatus || null;
    if (payload.preconditions !== undefined) backendPayload.preconditions = payload.preconditions || null;
    if (payload.expectedResult !== undefined) backendPayload.expected_result = payload.expectedResult;
    if (payload.notes !== undefined) backendPayload.notes = payload.notes || null;
    if (payload.testSteps !== undefined) {
      backendPayload.test_steps = (payload.testSteps || []).map((step: any) => ({
        action: step.action,
        test_data: step.testData || null,
      }));
    }

    const response = await fetch(`${API_URL}/api/v1/test-cases/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      const errData = await response.json();
      return NextResponse.json(
        { success: false, error: errData.detail || "Failed to update test case" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(mapBackendToFrontend(data));
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_URL}/api/v1/test-cases/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to delete test case" },
        { status: response.status }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
