import { NextResponse } from "next/server";
import { generateTestCasesExportXlsx, XLSX_MIME } from "@/lib/server/test-case-xlsx";

export const runtime = "nodejs";

export async function GET() {
  try {
    const buffer = await generateTestCasesExportXlsx();
    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(buffer, {
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
