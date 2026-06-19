import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

async function run() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Master Template", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  const columns = [
    { header: "TC ID", key: "displayId", width: 14 },
    { header: "Title", key: "title", width: 40 },
    { header: "Sub-Module", key: "subModule", width: 20 },
    { header: "Scenario", key: "scenario", width: 25 },
    { header: "Type", key: "type", width: 16 },
    { header: "Severity", key: "severity", width: 12 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Description", key: "description", width: 32 },
    { header: "Preconditions", key: "preconditions", width: 28 },
    { header: "Step Actions", key: "stepActions", width: 45 },
    { header: "Expected Result", key: "expectedResult", width: 38 },
    { header: "Actual Result", key: "actualResult", width: 38 },
    { header: "Notes", key: "notes", width: 24 },
    { header: "Automation Status", key: "automationStatus", width: 20 },
    { header: "Environment", key: "environment", width: 15 },
    { header: "Estimated Time", key: "estimatedTime", width: 15 },
    { header: "Requirement ID", key: "requirementId", width: 18 },
    { header: "Assigned To", key: "assignedTo", width: 20 },
    { header: "Category", key: "category", width: 14 },
    { header: "Author", key: "author", width: 18 },
    { header: "Release Version", key: "releaseVersion", width: 18 },
    { header: "Is Automated", key: "isAutomated", width: 14 },
  ];

  sheet.columns = columns;

  // Style Header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" }, // Slate 700
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF1E293B" } },
    };
  });

  // Save template
  const dir = path.join(process.cwd(), "apps/web/public/templates");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const file = path.join(dir, "Master Template.xlsx");
  await workbook.xlsx.writeFile(file);
  console.log("Created master template at:", file);
}

run().catch(console.error);
