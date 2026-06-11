import { NextResponse } from "next/server";
import { generateTestCasesTemplateXlsx, XLSX_MIME } from "@/lib/server/test-case-xlsx";

export const runtime = "nodejs";

export async function GET() {
  try {
    const buffer = generateTestCasesTemplateXlsx();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": XLSX_MIME,
        "Content-Disposition": "attachment; filename=\"test-cases-template.xlsx\"",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
