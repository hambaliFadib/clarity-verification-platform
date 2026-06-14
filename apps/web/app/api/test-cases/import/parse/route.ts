import { NextResponse } from "next/server";
import { parseTestCasesImportXlsx } from "@/lib/server/test-case-xlsx";
import { getRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ctx = await getRequestContext();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required." }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json({ error: "Only Excel (.xlsx) files are supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await parseTestCasesImportXlsx(buffer, ctx);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
