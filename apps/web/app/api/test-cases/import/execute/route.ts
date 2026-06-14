import { NextResponse } from "next/server";
import { getRequestContext, isGuestContext } from "@/lib/server/request-context";
import { createTestCase, updateTestCase } from "@/lib/server/qa-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const payload = await request.json();

    if (isGuestContext(ctx)) {
      const rows = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.items) ? payload.items : [];
      return NextResponse.json({
        created: rows.length,
        skipped: 0,
        overwritten: 0,
        errors: [],
        guest: true,
        message: "Guest import is simulated and resets on next guest sign-in.",
      });
    }

    const rows: any[] = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.items) ? payload.items : [];
    const overwrite: boolean = Boolean(payload?.overwrite);
    const overwriteIds: string[] = Array.isArray(payload?.overwrite_ids) ? payload.overwrite_ids : [];

    let created = 0;
    let overwritten = 0;
    let skipped = 0;
    const errors: { row: number; field: string; message: string }[] = [];

    for (const row of rows) {
      const rowIndex: number = row.rowIndex ?? 0;
      const displayId: string | undefined = row.display_id || row.displayId;

      try {
        const isDuplicate = displayId && overwriteIds.includes(displayId);

        if (isDuplicate && overwrite && displayId) {
          await updateTestCase(displayId, row, ctx);
          overwritten += 1;
        } else if (isDuplicate && !overwrite) {
          skipped += 1;
        } else {
          await createTestCase(row, ctx);
          created += 1;
        }
      } catch (err: any) {
        errors.push({
          row: rowIndex,
          field: "import",
          message: err?.message || "Failed to save test case.",
        });
      }
    }

    return NextResponse.json({ created, skipped, overwritten, errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
