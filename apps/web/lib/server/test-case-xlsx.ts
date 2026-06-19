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

  const scenarioText = testCase.scenarioName === "Positive"
    ? "✔ Positive"
    : testCase.scenarioName === "Negative"
    ? "❌ Negative"
    : (testCase.scenarioName || "");

  return [
    testCase.displayId || testCase.id,
    testCase.subModuleName || "",
    scenarioText,
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

    // Update Title text dynamically
    const titleCell = newSheet.getRow(1).getCell(1);
    titleCell.value = `${mod} — Test Cases`;
    titleCell.font = { name: "Inter", size: 12, bold: true, color: { argb: "FFFFFFFF" } };

    const rows = groups[mod];
    
    // Sort rows: Menu asc, Scenario asc, displayId/RealId asc
    rows.sort((a, b) => {
      const menuA = (a.subModuleName || "").toLowerCase();
      const menuB = (b.subModuleName || "").toLowerCase();
      if (menuA !== menuB) return menuA.localeCompare(menuB);
      
      const scnA = (a.scenarioName || "").toLowerCase();
      const scnB = (b.scenarioName || "").toLowerCase();
      if (scnA !== scnB) return scnA.localeCompare(scnB);
      
      return (a.displayId || a.id).localeCompare(b.displayId || b.id);
    });

    // Write Module Separator Row
    let currentRowNum = 3;
    newSheet.getRow(currentRowNum).height = 24;
    newSheet.mergeCells(currentRowNum, 1, currentRowNum, 18);
    const modCell = newSheet.getRow(currentRowNum).getCell(1);
    modCell.value = `MODULE: ${mod.toUpperCase()}`;
    modCell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    modCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" }, // Deep Navy
    };
    modCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    currentRowNum++;

    let lastMenu = "";
    let lastScenario = "";
    let tcCount = 0;

    rows.forEach((tc) => {
      const menu = tc.subModuleName || "General";
      const scenario = tc.scenarioName || "General";

      // Menu Separator
      if (menu !== lastMenu) {
        lastMenu = menu;
        lastScenario = ""; // Reset scenario to force category header under new menu
        
        newSheet.getRow(currentRowNum).height = 22;
        newSheet.mergeCells(currentRowNum, 1, currentRowNum, 18);
        const cell = newSheet.getRow(currentRowNum).getCell(1);
        cell.value = `• Menu: ${menu}`;
        cell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF2E5F8A" }, // Mid Blue
        };
        cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        currentRowNum++;
      }

      // Scenario Separator
      if (scenario !== lastScenario) {
        lastScenario = scenario;
        
        newSheet.getRow(currentRowNum).height = 20;
        newSheet.mergeCells(currentRowNum, 1, currentRowNum, 18);
        const cell = newSheet.getRow(currentRowNum).getCell(1);
        
        const isPositive = scenario.toLowerCase().includes("positive");
        const isNegative = scenario.toLowerCase().includes("negative");
        let prefix = "• ";
        let fgColor = "FFD97706"; // Edge Case / Suite Other - Amber
        if (isPositive) {
          prefix = "✔ ";
          fgColor = "FF16A34A"; // Green-600
        } else if (isNegative) {
          prefix = "❌ ";
          fgColor = "FFDC2626"; // Red-600
        }
        
        cell.value = `    ${prefix}${scenario}`;
        cell.font = { name: "Inter", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fgColor },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        currentRowNum++;
      }

      // Write Test Case Row
      tcCount++;
      const rowData = [tcCount, ...testCaseRow(tc)];
      const targetRow = newSheet.getRow(currentRowNum);
      targetRow.height = 60; // 60 pts height as per guide

      const rowBg = tcCount % 2 !== 0 ? "FFF8FAFC" : "FFEFF6FF";

      rowData.forEach((val, colIdx) => {
        const cell = targetRow.getCell(colIdx + 1);
        cell.value = val;

        cell.font = { name: "Inter", size: 9, color: { argb: "FF1A202C" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowBg },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };

        // Alignments: No, TC ID, Scenario/Suite, Type, Severity, Priority, Status, Author, Date Created, Sprint/Release, Automated?
        const centerCols = [1, 2, 4, 5, 7, 8, 9, 15, 16, 17, 18];
        cell.alignment = {
          vertical: "top",
          horizontal: centerCols.includes(colIdx + 1) ? "center" : "left",
          wrapText: true,
        };

        // TC ID (blue, bold)
        if (colIdx + 1 === 2) {
          cell.font = { name: "Inter", size: 9, bold: true, color: { argb: "FF2563EB" } };
        }

        // Severity colored badges
        if (colIdx + 1 === 7) {
          const sev = String(val).toLowerCase();
          let bg = "FFF3F4F6";
          let fg = "FF374151";
          if (sev === "critical" || sev === "blocker") {
            bg = "FFFEE2E2";
            fg = "FF7F1D1D";
          } else if (sev === "major") {
            bg = "FFFEF3C7";
            fg = "FF92400E";
          } else if (sev === "minor") {
            bg = "FFFEF9C3";
            fg = "FF713F12";
          } else if (sev === "low") {
            bg = "FFDCFCE7";
            fg = "FF14532D";
          }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bg },
          };
          cell.font = { name: "Inter", size: 9, bold: true, color: { argb: fg } };
        }

        // Status colored bold text
        if (colIdx + 1 === 9) {
          const stat = String(val).toLowerCase();
          let bg = "FFE0E7FF";
          let fg = "FF3730A3"; // Draft default
          if (stat === "approved" || stat === "pass") {
            bg = "FFDCFCE7";
            fg = "FF166534";
          } else if (stat === "fail" || stat === "obsolete") {
            bg = "FFFEE2E2";
            fg = "FF991B1B";
          } else if (stat === "ready" || stat === "blocked") {
            bg = "FFFEF3C7";
            fg = "FF92400E";
          } else if (stat === "in review" || stat === "skip") {
            bg = "FFF1F5F9";
            fg = "FF475569";
          }
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: bg },
          };
          cell.font = { name: "Inter", size: 9, bold: true, color: { argb: fg } };
        }
      });

      // Data Validations
      targetRow.getCell(5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Functional,UI,API,Security,Performance,Integration,Regression"'],
      };
      targetRow.getCell(7).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Blocker,Critical,Major,Minor"'],
      };
      targetRow.getCell(8).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Critical,High,Medium,Low"'],
      };
      targetRow.getCell(9).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Draft,Ready,In Review,Approved,Obsolete"'],
      };
      targetRow.getCell(18).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
      };

      currentRowNum++;
    });

    // Write 20 blank template rows at the bottom
    for (let i = 0; i < 20; i++) {
      const blankRow = newSheet.getRow(currentRowNum);
      blankRow.height = 50;
      
      const rowBg = (tcCount + i + 1) % 2 !== 0 ? "FFF8FAFC" : "FFEFF6FF";

      for (let col = 1; col <= 18; col++) {
        const cell = blankRow.getCell(col);
        cell.font = { name: "Inter", size: 9, color: { argb: "FF1A202C" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowBg },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };

        const centerCols = [1, 2, 4, 5, 7, 8, 9, 15, 16, 17, 18];
        cell.alignment = {
          vertical: "top",
          horizontal: centerCols.includes(col) ? "center" : "left",
          wrapText: true,
        };
      }

      // Add validations to blank rows
      blankRow.getCell(5).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Functional,UI,API,Security,Performance,Integration,Regression"'],
      };
      blankRow.getCell(7).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Blocker,Critical,Major,Minor"'],
      };
      blankRow.getCell(8).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Critical,High,Medium,Low"'],
      };
      blankRow.getCell(9).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Draft,Ready,In Review,Approved,Obsolete"'],
      };
      blankRow.getCell(18).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
      };

      currentRowNum++;
    }
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
    
    let headerRowNumber = 1;
    let headers: string[] = [];

    // Scan first 5 rows to find headers
    for (let r = 1; r <= 5; r++) {
      const row = sheet.getRow(r);
      const rowValues: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        rowValues.push(String(cell.value || "").trim().toLowerCase());
      });
      if (
        rowValues.includes("title") &&
        (rowValues.includes("severity") || rowValues.includes("type") || rowValues.includes("tc id") || rowValues.includes("expected result"))
      ) {
        headerRowNumber = r;
        row.eachCell({ includeEmpty: true }, (cell) => {
          headers.push(String(cell.value || ""));
        });
        break;
      }
    }

    if (headers.length === 0) {
      const headerRow = sheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell) => {
        headers.push(String(cell.value || ""));
      });
    }

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
      if (rowNumber <= headerRowNumber) return; 

      const values: string[] = [];
      for (let i = 1; i <= headers.length; i++) {
        const cell = row.getCell(i);
        values.push(cell.value !== null && cell.value !== undefined ? String(cell.value) : "");
      }

      if (!values.some(v => v.trim())) return; 

      // Skip separator / decorative rows (MODULE:, • Menu:, ✔ Positive, ❌ Negative)
      const firstVal = values[0] || "";
      if (
        firstVal.startsWith("MODULE:") || 
        firstVal.trim().startsWith("• Menu:") || 
        firstVal.trim().startsWith("•") || 
        firstVal.trim().startsWith("✔") || 
        firstVal.trim().startsWith("❌")
      ) {
        return; 
      }

      const hasNoCol = headerIndex(headers, ["No"]) >= 0;
      if (hasNoCol) {
        const noVal = valueAt(values, headers, ["No"]);
        if (!noVal || isNaN(Number(noVal))) {
          return; 
        }
      }

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
      const isAutomatedText = valueAt(values, headers, ["Is Automated", "Automation?", "Automated", "Automated?"]);
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
