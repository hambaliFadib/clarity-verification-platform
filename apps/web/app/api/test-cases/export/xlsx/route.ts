import { NextResponse } from "next/server";
import { generateTestCasesExportXlsx, XLSX_MIME } from "@/lib/server/test-case-xlsx";
import { getRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function GET() {
  try {
    const ctx = await getRequestContext();
    const buffer = await generateTestCasesExportXlsx(ctx);
    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="test-cases-${today}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
