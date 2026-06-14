import { NextResponse } from "next/server";
import { query } from "@/lib/server/db";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

/**
 * POST /api/admin/cleanup-guest-data
 * Removes orphan/guest-created data from all scoped tables.
 * Only accessible by non-guest (real) authenticated users.
 * Run once to fix the data leakage issue caused by auto project_id assignment.
 */
export async function POST() {
  try {
    const ctx = await getRequestContext();

    // Only allow real authenticated users
    if (isGuestContext(ctx) || !ctx.userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const results: Record<string, number> = {};

    // Delete defects created by guest
    const defectRes = await query(
      `DELETE FROM defects
       WHERE reported_by ILIKE 'Guest User'
          OR reported_by ILIKE '%guest%'
          OR project_id IS NULL
       RETURNING id`
    );
    results.defects_deleted = defectRes.rowCount ?? 0;

    // Delete orphan test_steps first (FK)
    await query(
      `DELETE FROM test_steps
       WHERE test_case_id IN (SELECT id FROM test_cases WHERE project_id IS NULL)`
    );

    // Delete orphan test_cases
    const tcRes = await query(
      `DELETE FROM test_cases WHERE project_id IS NULL RETURNING id`
    );
    results.test_cases_deleted = tcRes.rowCount ?? 0;

    // Delete orphan test_run children first
    await query(
      `DELETE FROM test_run_test_cases
       WHERE test_run_id IN (SELECT id FROM test_runs WHERE project_id IS NULL)`
    );
    await query(
      `DELETE FROM test_run_executions
       WHERE test_run_id IN (SELECT id FROM test_runs WHERE project_id IS NULL)`
    );

    // Delete orphan test_runs
    const trRes = await query(
      `DELETE FROM test_runs WHERE project_id IS NULL RETURNING id`
    );
    results.test_runs_deleted = trRes.rowCount ?? 0;

    // Delete orphan environments, releases, work_items, activity_items
    const envRes = await query(`DELETE FROM environments WHERE project_id IS NULL RETURNING id`);
    results.environments_deleted = envRes.rowCount ?? 0;

    const relRes = await query(`DELETE FROM releases WHERE project_id IS NULL RETURNING id`);
    results.releases_deleted = relRes.rowCount ?? 0;

    const wiRes = await query(`DELETE FROM work_items WHERE project_id IS NULL RETURNING id`);
    results.work_items_deleted = wiRes.rowCount ?? 0;

    const aiRes = await query(`DELETE FROM activity_items WHERE project_id IS NULL RETURNING id`);
    results.activity_items_deleted = aiRes.rowCount ?? 0;

    return NextResponse.json({
      success: true,
      message: "Guest/orphan data cleaned up successfully.",
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
