import { NextResponse } from "next/server";
import {
  listDefects,
  listRequirements,
  listTestCases,
  listTestRuns,
} from "@/lib/server/qa-repository";
import {
  guestDefects,
  guestRequirements,
  guestTestCases,
  guestTestRuns,
} from "@/lib/server/guest-fixtures";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

function countBy<T>(items: T[], selector: (item: T) => string | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item) || "Unspecified";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function averagePassRate(runs: any[]) {
  if (runs.length === 0) return 0;
  const total = runs.reduce((sum, run) => {
    const totalCases = Number(run.totalCases || 0);
    if (totalCases <= 0) return sum;
    return sum + (Number(run.passed || 0) / totalCases) * 100;
  }, 0);
  return Math.round((total / runs.length) * 100) / 100;
}

function qualityScore(requirements: any[], testCases: any[], testRuns: any[], defects: any[]) {
  let score = 0;

  if (requirements.length > 0) {
    const approved = requirements.filter((item) => ["Approved", "Baseline"].includes(item.status)).length;
    score += (approved / requirements.length) * 25;
  }

  if (testCases.length > 0) {
    const approved = testCases.filter((item) => item.status === "Approved").length;
    score += (approved / testCases.length) * 25;
  }

  const passRate = averagePassRate(testRuns);
  if (testRuns.length > 0) {
    score += (passRate / 100) * 25;
  }

  if (defects.length > 0) {
    const closed = defects.filter((item) => ["Closed", "Resolved"].includes(item.status)).length;
    score += (closed / defects.length) * 25;
  }

  return Math.round(score * 100) / 100;
}

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const params = new URLSearchParams({ limit: "10000" });
    const isGuest = isGuestContext(ctx);

    const requirements: any[] = isGuest ? guestRequirements() : (await listRequirements(params, ctx)).items;
    const testCases: any[] = isGuest ? guestTestCases() : (await listTestCases(params, ctx)).items;
    const testRuns: any[] = isGuest ? guestTestRuns() : (await listTestRuns(params, ctx)).items;
    const defects: any[] = isGuest ? guestDefects() : (await listDefects(params, ctx)).items;
    const avgPassRate = averagePassRate(testRuns);

    return NextResponse.json({
      requirements: {
        total: requirements.length,
        by_status: countBy(requirements, (item) => item.status),
        by_priority: countBy(requirements, (item) => item.priority),
      },
      test_cases: {
        total: testCases.length,
        by_status: countBy(testCases, (item) => item.status),
        by_type: countBy(testCases, (item) => item.type),
      },
      test_runs: {
        total: testRuns.length,
        by_status: countBy(testRuns, (item) => item.status),
        avg_pass_rate: avgPassRate,
      },
      defects: {
        total: defects.length,
        by_status: countBy(defects, (item) => item.status),
        by_severity: countBy(defects, (item) => item.severity),
      },
      quality_score: qualityScore(requirements, testCases, testRuns, defects),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
