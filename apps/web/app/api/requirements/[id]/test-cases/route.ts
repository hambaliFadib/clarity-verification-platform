import { NextResponse } from "next/server";
import {
  linkRequirementTestCase,
  listRequirementTestCases,
  unlinkRequirementTestCase,
} from "@/lib/server/qa-repository";
import { guestTestCases, globalGuestStore } from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function optionalJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return {};
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function guestRequirementExists(id: string) {
  return id.startsWith("guest-")
    || id === "GUEST-REQ-001"
    || guestTestCases().some((item) => item.requirementId === id);
}

function defaultGuestLinks(id: string) {
  if (globalGuestStore.requirementTestCases[id] !== undefined) {
    const allTcs = guestTestCases();
    return globalGuestStore.requirementTestCases[id]
      .map(tcId => allTcs.find(tc => tc.id === tcId || tc.displayId === tcId))
      .filter(Boolean);
  }
  return id === "GUEST-REQ-001" ? guestTestCases().slice(0, 1) : [];
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    if (isGuestContext(ctx)) return NextResponse.json(defaultGuestLinks(id));
    const testCases = await listRequirementTestCases(id, ctx);
    return testCases
      ? NextResponse.json(testCases)
      : NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const body: any = await optionalJson(request);
    const testCaseId = body.testCaseId || body.test_case_id || searchParams.get("testCaseId") || searchParams.get("test_case_id");
    if (!testCaseId) {
      return NextResponse.json({ success: false, error: "testCaseId is required" }, { status: 400 });
    }

    if (isGuestContext(ctx)) {
      const testCase = guestTestCases().find((item) => item.id === testCaseId || item.displayId === testCaseId);
      if (!guestRequirementExists(id) || !testCase) {
        return NextResponse.json({ success: false, error: "Requirement or test case not found" }, { status: 404 });
      }
      
      const currentLinks = globalGuestStore.requirementTestCases[id] || (id === "GUEST-REQ-001" ? [guestTestCases()[0].id] : []);
      if (!currentLinks.includes(testCaseId)) {
        globalGuestStore.requirementTestCases[id] = [...currentLinks, testCaseId];
      }
      
      return NextResponse.json({ message: "Guest link simulated", testCase }, { status: 201 });
    }

    const linked = await linkRequirementTestCase(id, testCaseId, ctx);
    const linkedTestCases = linked ? await listRequirementTestCases(id, ctx) : null;
    const testCase = linkedTestCases?.find((item: any) => item.id === testCaseId || item.realId === testCaseId || item.displayId === testCaseId);
    return linked
      ? NextResponse.json({ message: "Test case linked successfully", testCase }, { status: 201 })
      : NextResponse.json({ success: false, error: "Requirement or test case not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const ctx = await getRequestContext();
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const testCaseId = searchParams.get("testCaseId") || searchParams.get("test_case_id");
    if (!testCaseId) {
      return NextResponse.json({ success: false, error: "testCaseId is required" }, { status: 400 });
    }

    if (isGuestContext(ctx)) {
      const testCase = guestTestCases().find((item) => item.id === testCaseId || item.displayId === testCaseId);
      if (!guestRequirementExists(id) || !testCase) {
        return NextResponse.json({ success: false, error: "Requirement or test case not found" }, { status: 404 });
      }
      
      const currentLinks = globalGuestStore.requirementTestCases[id] || (id === "GUEST-REQ-001" ? [guestTestCases()[0].id] : []);
      globalGuestStore.requirementTestCases[id] = currentLinks.filter(tid => tid !== testCaseId && tid !== testCase.displayId);
      
      return NextResponse.json({ message: "Guest unlink simulated", testCaseId: testCase.id });
    }

    const unlinked = await unlinkRequirementTestCase(id, testCaseId, ctx);
    return unlinked
      ? NextResponse.json({ message: "Test case unlinked successfully" })
      : NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
