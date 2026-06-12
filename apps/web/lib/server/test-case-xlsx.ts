import { listTestCases } from "@/lib/server/qa-repository";
import type { TestCase } from "@/lib/types";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const COL = {
  displayId: "TC ID",
  title: "Title",
  module: "Module",
  type: "Type",
  severity: "Severity",
  status: "Status",
  description: "Description",
  preconditions: "Preconditions",
  stepActions: "Step Actions",
  expectedResult: "Expected Result",
  notes: "Notes",
  automationStatus: "Automation Status",
  environment: "Environment",
  estimatedTime: "Estimated Time",
  tags: "Tags",
  requirementId: "Requirement ID",
  assignedTo: "Assigned To",
} as const;

const EXPORT_HEADER = Object.values(COL);
const COLUMN_WIDTHS = [14, 40, 20, 16, 12, 14, 32, 28, 45, 38, 24, 13, 13, 13, 13, 13, 13];

const VALID_TYPES = ["Functional", "Regression", "Smoke", "Integration", "UI", "Performance", "Security"].sort();
const VALID_SEVERITIES = ["Blocker", "Critical", "Major", "Minor"].sort();
const VALID_STATUSES = ["Draft", "Ready", "In Review", "Approved", "Obsolete"].sort();
const VALID_ENVIRONMENTS = ["Staging", "Production", "UAT", "Development"].sort();
const VALID_AUTOMATION_STATUSES = ["Manual", "Automated", "Candidate to Automate"].sort();

const DATA_VALIDATIONS: Record<string, string[]> = {
  [COL.type]: VALID_TYPES,
  [COL.severity]: VALID_SEVERITIES,
  [COL.status]: VALID_STATUSES,
  [COL.automationStatus]: VALID_AUTOMATION_STATUSES,
  [COL.environment]: VALID_ENVIRONMENTS,
};

export { XLSX_MIME };

function columnLetter(index: number) {
  let value = index;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function inlineStringCell(ref: string, value: unknown, style = 0) {
  const styleAttr = style > 0 ? ` s="${style}"` : "";
  return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t>${escapeXml(value)}</t></is></c>`;
}

function rowXml(
  rowIndex: number,
  values: unknown[],
  options: { height?: number; style?: number; wrapColumns?: number[]; omitEmpty?: boolean } = {},
) {
  const height = options.height ? ` ht="${options.height}" customHeight="1"` : "";
  const style = options.style ?? 2;
  const cells = values
    .map((value, index) => {
      if (options.omitEmpty && (value === null || value === undefined || value === "")) return "";
      const col = index + 1;
      const cellStyle = options.wrapColumns?.includes(col) ? 2 : style;
      return inlineStringCell(`${columnLetter(col)}${rowIndex}`, value ?? "", cellStyle);
    })
    .join("");
  return `<row r="${rowIndex}"${height}>${cells}</row>`;
}

function numberedList(items: Array<string | undefined>) {
  const lines = items
    .map((item, index) => (item ? `${index + 1}. ${item}` : null))
    .filter(Boolean);
  return lines.length ? lines.join("\n") : "";
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
    testCase.id,
    testCase.title,
    testCase.module,
    testCase.type,
    testCase.severity,
    testCase.status,
    testCase.description,
    testCase.preconditions,
    stepsText,
    testCase.expectedResult,
    testCase.notes,
    testCase.automationStatus,
    testCase.environment,
    testCase.estimatedTime,
    testCase.tags?.join(";"),
    testCase.requirementId,
    testCase.assignedTo,
  ];
}

function columnWidthsXml() {
  return `<cols>${EXPORT_HEADER.map((header, index) => {
    const width = COLUMN_WIDTHS[index] ?? Math.max(header.length + 4, 10);
    const col = index + 1;
    return `<col min="${col}" max="${col}" width="${width}" customWidth="1"/>`;
  }).join("")}</cols>`;
}

function dataValidationsXml() {
  const validations = Object.entries(DATA_VALIDATIONS).map(([header, choices]) => {
    const colIndex = EXPORT_HEADER.indexOf(header as (typeof EXPORT_HEADER)[number]) + 1;
    const col = columnLetter(colIndex);
    const formula = `"${choices.join(",")}"`;
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Invalid value" error="${escapeXml(
      `Choose one of: ${choices.join(", ")}`,
    )}" sqref="${col}2:${col}501"><formula1>${escapeXml(formula)}</formula1></dataValidation>`;
  });
  return `<dataValidations count="${validations.length}">${validations.join("")}</dataValidations>`;
}

function worksheetXml(rows: unknown[][], options: { includeDataValidations?: boolean; secondRowHeight?: number } = {}) {
  const bodyRows = rows
    .map((values, index) =>
      rowXml(index + 2, values, {
        height: index === 0 ? options.secondRowHeight : undefined,
        style: 0,
        wrapColumns: [9],
        omitEmpty: true,
      }),
    )
    .join("");

  return xml(`\
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  ${columnWidthsXml()}
  <sheetData>
    ${rowXml(1, EXPORT_HEADER, { height: 30, style: 1 })}
    ${bodyRows}
  </sheetData>
  ${options.includeDataValidations ? dataValidationsXml() : ""}
</worksheet>`);
}

function xml(value: string) {
  return value
    .replace(/^\s+/gm, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function workbookXml() {
  return xml(`\
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Test Cases" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);
}

function workbookRelsXml() {
  return xml(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
}

function rootRelsXml() {
  return xml(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
}

function contentTypesXml() {
  return xml(`\
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);
}

function stylesXml() {
  return xml(`\
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="00FFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="00595959"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`);
}

function templateRows() {
  return [[
    "",
    "Verify login with valid credentials",
    "Authentication",
    "Functional",
    "Major",
    "Draft",
    "Test that a registered user can log in using correct credentials",
    "User must be registered in the system",
    "1. Open the login page\n2. Enter valid username and password\n3. Click the Login button",
    "User is redirected to dashboard after successful login",
    "",
    "Manual",
    "Staging",
    "5 min",
    "auth;login",
    "REQ-AUTH-001",
    "",
  ]];
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function buildZip(files: Array<{ path: string; content: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.path, "utf8");
    const data = Buffer.from(file.content, "utf8");
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);

    offset += local.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function buildWorkbook(sheetXml: string) {
  return buildZip([
    { path: "[Content_Types].xml", content: contentTypesXml() },
    { path: "_rels/.rels", content: rootRelsXml() },
    { path: "xl/workbook.xml", content: workbookXml() },
    { path: "xl/_rels/workbook.xml.rels", content: workbookRelsXml() },
    { path: "xl/styles.xml", content: stylesXml() },
    { path: "xl/worksheets/sheet1.xml", content: sheetXml },
  ]);
}

export async function generateTestCasesExportXlsx() {
  const params = new URLSearchParams({ limit: "10000" });
  const { items } = await listTestCases(params);
  return buildWorkbook(worksheetXml(items.map(testCaseRow)));
}

export function generateTestCasesTemplateXlsx() {
  return buildWorkbook(worksheetXml(templateRows(), { includeDataValidations: true, secondRowHeight: 60 }));
}
