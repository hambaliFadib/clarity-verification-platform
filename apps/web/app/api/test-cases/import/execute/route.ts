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

    // Build a lookup map: displayId → action ("skip" | "overwrite")
    // Frontend sends: duplicateActions: [{ displayId: string, action: "skip" | "overwrite" }]
    const duplicateActionMap = new Map<string, "skip" | "overwrite">();
    if (Array.isArray(payload?.duplicateActions)) {
      for (const entry of payload.duplicateActions) {
        if (entry?.displayId && entry?.action) {
          duplicateActionMap.set(String(entry.displayId).toLowerCase(), entry.action);
        }
      }
    }

    let created = 0;
    let overwritten = 0;
    let skipped = 0;
    const errors: { row: number; field: string; message: string }[] = [];

    for (const row of rows) {
      const rowIndex: number = row.rowIndex ?? 0;
      // The parser stores the existing TC id as display_id on the row
      const displayId: string | undefined = row.display_id || row.displayId;
      const duplicateAction = displayId ? duplicateActionMap.get(displayId.toLowerCase()) : undefined;

      try {
        if (duplicateAction === "overwrite" && displayId) {
          await updateTestCase(displayId, row, ctx);
          overwritten += 1;
        } else if (duplicateAction === "skip") {
          skipped += 1;
        } else {
          // No duplicate action means it's a brand-new row — create it
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
