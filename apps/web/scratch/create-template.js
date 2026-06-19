import ExcelJS from "exceljs";
import path from "path";
import fs from "fs";

async function run() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Master Template", {
    views: [{ state: "frozen", xSplit: 4, ySplit: 2 }],
  });

  const columns = [
    { header: "No", key: "no", width: 5 },
    { header: "TC ID", key: "displayId", width: 16 },
    { header: "Menu", key: "subModule", width: 22 },
    { header: "Scenario / Suite", key: "scenario", width: 28 },
    { header: "Type", key: "type", width: 12 },
    { header: "Title", key: "title", width: 38 },
    { header: "Severity", key: "severity", width: 12 },
    { header: "Priority", key: "priority", width: 12 },
    { header: "Status", key: "status", width: 13 },
    { header: "Preconditions", key: "preconditions", width: 35 },
    { header: "Step Actions", key: "stepActions", width: 50 },
    { header: "Expected Result", key: "expectedResult", width: 40 },
    { header: "Actual Result", key: "actualResult", width: 40 },
    { header: "Notes / Evidence", key: "notes", width: 30 },
    { header: "Author", key: "author", width: 16 },
    { header: "Date Created", key: "createdAt", width: 15 },
    { header: "Sprint / Release", key: "releaseVersion", width: 16 },
    { header: "Automated?", key: "isAutomated", width: 13 },
  ];

  // Set columns (this will set the widths and headers in row 1, but we will move headers to row 2)
  sheet.columns = columns;

  // Insert a new row at 1 for the Title, which shifts headers to row 2
  sheet.insertRow(1, []);
  
  // Set Row 1 (Title)
  const titleRow = sheet.getRow(1);
  titleRow.height = 40;
  sheet.mergeCells("A1:R1");
  const titleCell = titleRow.getCell(1);
  titleCell.value = "Master Data — Test Cases";
  titleCell.font = { name: "Inter", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" }, // Dark Slate 800
  };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  // Set Row 2 (Headers)
  const headerRow = sheet.getRow(2);
  headerRow.height = 28;

  // Set the header text values in row 2 manually
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF334155" }, // Slate 700
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E293B" } },
      bottom: { style: "medium", color: { argb: "FF1E293B" } },
      left: { style: "thin", color: { argb: "FF1E293B" } },
      right: { style: "thin", color: { argb: "FF1E293B" } },
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
