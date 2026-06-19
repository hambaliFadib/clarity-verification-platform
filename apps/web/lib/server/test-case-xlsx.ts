import { listTestCases } from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import type { ProjectAccessContext } from "@/lib/server/qa-repository";
import type { TestCase } from "@/lib/types";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const COL = {
  displayId: "TC ID",
  subModule: "Menu",
  scenario: "Scenario / Suite",
  type: "Type",
  title: "Title",
  severity: "Severity",
  priority: "Priority",
  status: "Status",
  preconditions: "Preconditions",
  stepActions: "Step Actions",
  expectedResult: "Expected Result",
  actualResult: "Actual Result",
  notes: "Notes / Evidence",
  author: "Author",
  createdAt: "Date Created",
  releaseVersion: "Sprint / Release",
  isAutomated: "Automation?",
} as const;

const VALID_TYPES = ["Functional", "Regression", "Smoke", "Integration", "UI", "Performance", "Security"].sort();
const VALID_SEVERITIES = ["Blocker", "Critical", "Major", "Minor"].sort();
const VALID_PRIORITIES = ["Critical", "High", "Medium", "Low"].sort();
const VALID_STATUSES = ["Draft", "Ready", "In Review", "Approved", "Obsolete"].sort();
const VALID_ENVIRONMENTS = ["Staging", "Production", "UAT", "Development"].sort();
const VALID_AUTOMATION_STATUSES = ["Manual", "Automated", "Candidate to Automate"].sort();
const VALID_CATEGORIES = ["Positive", "Negative"].sort();

export { XLSX_MIME };

function findTemplatePath() {
  const candidates = [
    path.join(process.cwd(), "apps/web/public/templates/Master Template.xlsx"),
    path.join(process.cwd(), "public/templates/Master Template.xlsx"),
    path.join(process.cwd(), "../apps/web/public/templates/Master Template.xlsx"),
    path.join(process.cwd(), "../../apps/web/public/templates/Master Template.xlsx"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Master Template.xlsx not found. Tried paths:\n${candidates.join("\n")}`);
}

function normalizeHeader(value: string) {
  return value
    .replace(/[-_\s]+/g, "")
    .trim()
    .toLowerCase();
}

function headerIndex(headers: string[], aliases: string[]) {
  const normalized = headers.map(normalizeHeader);
  return aliases
    .map(normalizeHeader)
    .map((alias) => normalized.indexOf(alias))
    .find((index) => index >= 0) ?? -1;
}

function valueAt(row: string[], headers: string[], aliases: string[]) {
  const index = headerIndex(headers, aliases);
  return index >= 0 ? (row[index] || "").trim() : "";
}

function parseSteps(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const steps: Array<{ action: string; expectedResult?: string; testData?: string }> = [];

  for (const line of lines) {
    const stepMatch = line.match(/^\d+[.)]\s*(.+)$/);
    const expectedMatch = line.match(/^expected\s*:\s*(.+)$/i);
    const dataMatch = line.match(/^test data\s*:\s*(.+)$/i);

    if (stepMatch) {
      steps.push({ action: stepMatch[1].trim() });
    } else if (expectedMatch && steps.length > 0) {
      steps[steps.length - 1].expectedResult = expectedMatch[1].trim();
    } else if (dataMatch && steps.length > 0) {
      steps[steps.length - 1].testData = dataMatch[1].trim();
    } else if (steps.length > 0) {
      steps[steps.length - 1].action = `${steps[steps.length - 1].action}\n${line}`;
    } else {
      steps.push({ action: line });
    }
  }

  return steps.length > 0 ? steps : undefined;
}

function validateChoiceInSheet(
  errors: ImportError[],
  rowNumber: number,
  field: string,
  value: string,
  choices: string[],
  sheetName: string,
) {
  if (value && !choices.some((choice) => choice.toLowerCase() === value.toLowerCase())) {
    errors.push({
      row: rowNumber,
      field,
      message: `Use one of: ${choices.join(", ")} (in sheet '${sheetName}').`,
    });
  }
}

function copyWorksheet(srcSheet: ExcelJS.Worksheet, destSheet: ExcelJS.Worksheet) {
  destSheet.views = srcSheet.views;
  
  destSheet.columns = srcSheet.columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width,
    style: col.style,
  }));

  srcSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const destRow = destSheet.getRow(rowNumber);
    destRow.height = row.height;
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const destCell = destRow.getCell(colNumber);
      destCell.value = cell.value;
      destCell.style = cell.style;
    });
  });

  if (srcSheet.model.merges) {
    srcSheet.model.merges.forEach((mergeRange) => {
      destSheet.mergeCells(mergeRange);
    });
  }
}

function testCaseRow(testCase: TestCase) {
  const stepsText = testCase.steps && testCase.steps.length > 0
    ? testCase.steps.map((step) => {
        let line = `${step.stepNumber}. ${step.action || ""}`;
        if (step.testData) {
          line += `\n   Test Data: ${step.testData}`;
        }
        if (step.expectedResult) {
          line += `\n   Expected: ${step.expectedResult}`;
        }
        return line;
      }).join("\n")
    : "";

  return [
    testCase.displayId || testCase.id,
    testCase.subModuleName || "",
    testCase.scenarioName || "",
    testCase.type,
    testCase.title,
    testCase.severity,
    testCase.priority || "Medium",
    testCase.status,
    testCase.preconditions,
    stepsText,
    testCase.expectedResult,
    testCase.actualResult || "",
    testCase.notes || "",
    testCase.author || "",
    testCase.createdAt ? ((testCase.createdAt as any) instanceof Date ? (testCase.createdAt as any).toISOString().split("T")[0] : String(testCase.createdAt).split("T")[0]) : "",
    testCase.releaseVersion || "",
    testCase.isAutomated ? "Yes" : "No",
  ];
}

export async function generateTestCasesExportXlsx(ctx?: ProjectAccessContext) {
  const params = new URLSearchParams({ limit: "10000" });
  const items = ctx?.isGuest || ctx?.userId === "guest-user"
    ? guestTestCases()
    : (await listTestCases(params, ctx)).items;

  const groups: Record<string, TestCase[]> = {};
  for (const item of items) {
    const mod = (item.moduleName || item.moduleId || "General").trim();
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(item);
  }

  const sortedModules = Object.keys(groups).sort();
  if (sortedModules.length === 0) {
    sortedModules.push("General");
    groups["General"] = [];
  }

  const workbook = new ExcelJS.Workbook();
  const templatePath = findTemplatePath();
  await workbook.xlsx.readFile(templatePath);
  
  const templateSheet = workbook.getWorksheet(1);
  if (!templateSheet) throw new Error("Template sheet not found in Master Template.xlsx");

  const originalSheetId = templateSheet.id;

  for (const mod of sortedModules) {
    // Sheet name must not exceed 31 chars
    const sheetName = mod.substring(0, 30);
    const newSheet = workbook.addWorksheet(sheetName);
    
    copyWorksheet(templateSheet, newSheet);

    const rows = groups[mod];
    rows.forEach((tc, idx) => {
      const rowData = testCaseRow(tc);
      const rowNum = idx + 2;
      const targetRow = newSheet.getRow(rowNum);
      
      rowData.forEach((val, colIdx) => {
        const cell = targetRow.getCell(colIdx + 1);
        cell.value = val;
        
        // Preserve data styling (Inter, size 9, normal weight)
        cell.font = { name: "Inter", size: 9 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
        
        // Align center for specific fields
        const centerCols = [1, 4, 6, 7, 8, 14, 15, 16, 17];
        cell.alignment = {
          vertical: "top",
          horizontal: centerCols.includes(colIdx + 1) ? "center" : "left",
          wrapText: true,
        };
      });
      targetRow.commit();
    });
  }

  workbook.removeWorksheet(originalSheetId);
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function generateTestCasesTemplateXlsx() {
  const workbook = new ExcelJS.Workbook();
  const templatePath = findTemplatePath();
  await workbook.xlsx.readFile(templatePath);
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

type ImportError = {
  row: number;
  field: string;
  message: string;
};

export async function parseTestCasesImportXlsx(buffer: any, ctx?: ProjectAccessContext) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const errors: ImportError[] = [];
  const validRows: any[] = [];
  const duplicates: any[] = [];
  let totalParsed = 0;

  const existingItems = ctx?.isGuest || ctx?.userId === "guest-user"
    ? guestTestCases()
    : (await listTestCases(new URLSearchParams({ limit: "10000" }), ctx)).items;
  const existingByDisplayId = new Map(existingItems.map((item) => [item.id.toLowerCase(), item]));

  workbook.eachSheet((sheet) => {
    const sheetName = sheet.name;
    
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      headers.push(String(cell.value || ""));
    });

    const REQUIRED_COLUMNS = [
      { label: "Title", aliases: ["Title"] },
      { label: "Type", aliases: ["Type"] },
      { label: "Severity", aliases: ["Severity"] },
      { label: "Expected Result", aliases: ["Expected Result"] },
      { label: "Step Actions", aliases: ["Step Actions", "Steps"] },
    ];

    const hasMatch = REQUIRED_COLUMNS.some(col => headerIndex(headers, col.aliases) >= 0);
    if (!hasMatch) return; 

    const missing = REQUIRED_COLUMNS
      .filter(col => headerIndex(headers, col.aliases) < 0)
      .map(col => col.label);

    if (missing.length > 0) {
      errors.push({
        row: 0,
        field: `Sheet '${sheetName}' Header`,
        message: `Missing required columns: ${missing.join(", ")}.`,
      });
      return;
    }

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; 

      const values: string[] = [];
      for (let i = 1; i <= headers.length; i++) {
        const cell = row.getCell(i);
        values.push(cell.value !== null && cell.value !== undefined ? String(cell.value) : "");
      }

      if (!values.some(v => v.trim())) return; 

      totalParsed++;

      if (totalParsed > 500) {
        errors.push({
          row: 0,
          field: "file",
          message: "Only the first 500 rows across all sheets can be imported at once.",
        });
        return;
      }

      const displayId = valueAt(values, headers, ["TC ID", "ID", "Display ID"]);
      const title = valueAt(values, headers, ["Title"]);
      const subModule = valueAt(values, headers, ["Sub-Module", "Submodule", "Menu"]);
      const scenario = valueAt(values, headers, ["Scenario", "Scenario Name", "Scenario / Suite", "Suite"]);
      const type = valueAt(values, headers, ["Type"]) || "Functional";
      const severity = valueAt(values, headers, ["Severity"]) || "Major";
      const priority = valueAt(values, headers, ["Priority"]) || "Medium";
      const status = valueAt(values, headers, ["Status"]) || "Draft";
      const description = valueAt(values, headers, ["Description"]);
      const preconditions = valueAt(values, headers, ["Preconditions"]);
      const stepActions = valueAt(values, headers, ["Step Actions", "Steps"]);
      const expectedResult = valueAt(values, headers, ["Expected Result"]);
      const actualResult = valueAt(values, headers, ["Actual Result"]);
      const notes = valueAt(values, headers, ["Notes", "Notes / Evidence", "Evidence"]);
      const automationStatus = valueAt(values, headers, ["Automation Status"]) || "Manual";
      const environment = valueAt(values, headers, ["Environment"]);
      const estimatedTime = valueAt(values, headers, ["Estimated Time"]);
      const requirementId = valueAt(values, headers, ["Requirement ID"]);
      const assignedTo = valueAt(values, headers, ["Assigned To"]);
      const category = valueAt(values, headers, ["Category"]) || "Positive";
      const author = valueAt(values, headers, ["Author"]);
      const releaseVersion = valueAt(values, headers, ["Release Version", "Sprint / Release", "Sprint", "Release"]);
      const isAutomatedText = valueAt(values, headers, ["Is Automated", "Automation?", "Automated"]);
      const isAutomated = isAutomatedText.toLowerCase() === "yes" || isAutomatedText.toLowerCase() === "true" || isAutomatedText === "1";

      if (!title) {
        errors.push({ row: rowNumber, field: "Title", message: `Title is required (in sheet '${sheetName}').` });
        return;
      }

      validateChoiceInSheet(errors, rowNumber, "Type", type, VALID_TYPES, sheetName);
      validateChoiceInSheet(errors, rowNumber, "Severity", severity, VALID_SEVERITIES, sheetName);
      validateChoiceInSheet(errors, rowNumber, "Priority", priority, VALID_PRIORITIES, sheetName);
      validateChoiceInSheet(errors, rowNumber, "Status", status, VALID_STATUSES, sheetName);
      validateChoiceInSheet(errors, rowNumber, "Automation Status", automationStatus, VALID_AUTOMATION_STATUSES, sheetName);
      validateChoiceInSheet(errors, rowNumber, "Category", category, VALID_CATEGORIES, sheetName);

      const parsedRow = {
        rowIndex: rowNumber,
        displayId: displayId || undefined,
        display_id: displayId || undefined,
        title,
        module: sheetName,
        subModule: subModule || undefined,
        scenario: scenario || undefined,
        type,
        severity,
        priority,
        status,
        description: description || undefined,
        preconditions: preconditions || undefined,
        testSteps: parseSteps(stepActions),
        expectedResult: expectedResult || undefined,
        actualResult: actualResult || undefined,
        notes: notes || undefined,
        automationStatus,
        environment: environment || undefined,
        estimatedTime: estimatedTime || undefined,
        requirementId: requirementId || undefined,
        assignedTo: assignedTo || undefined,
        category,
        author: author || undefined,
        releaseVersion: releaseVersion || undefined,
        isAutomated,
      };

      validRows.push(parsedRow);

      if (displayId) {
        const duplicate = existingByDisplayId.get(displayId.toLowerCase());
        if (duplicate) {
          duplicates.push({
            row_index: rowNumber,
            display_id: displayId,
            import_title: title,
            existing_title: duplicate.title,
            existing_status: duplicate.status,
          });
        }
      }
    });
  });

  if (validRows.length === 0 && duplicates.length === 0 && errors.length === 0) {
    errors.push({
      row: 0,
      field: "file",
      message: "No valid sheets containing test cases were found in the uploaded file.",
    });
  }

  return {
    total_parsed: totalParsed,
    valid_rows: validRows,
    duplicates,
    errors,
  };
}
