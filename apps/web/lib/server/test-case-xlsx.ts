import { listTestCases } from "@/lib/server/qa-repository";
import { guestTestCases } from "@/lib/server/guest-fixtures";
import type { ProjectAccessContext } from "@/lib/server/qa-repository";
import type { TestCase } from "@/lib/types";
import { inflateRawSync } from "zlib";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const COL = {
  displayId: "TC ID",
  title: "Title",
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
const COLUMN_WIDTHS = [14, 40, 16, 12, 14, 32, 28, 45, 38, 24, 13, 13, 13, 13, 13, 13];

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

function sanitizeSheetName(name: string, existingNames: Set<string>): string {
  let cleaned = name.replace(/[\\/\?\*:\[\]]/g, "").trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) {
    cleaned = "Module";
  }
  const base = cleaned.substring(0, 31);
  if (!existingNames.has(base.toLowerCase())) {
    existingNames.add(base.toLowerCase());
    return base;
  }
  let counter = 1;
  while (true) {
    const suffix = `_${counter}`;
    const maxBaseLen = 31 - suffix.length;
    const candidate = cleaned.substring(0, maxBaseLen) + suffix;
    if (!existingNames.has(candidate.toLowerCase())) {
      existingNames.add(candidate.toLowerCase());
      return candidate;
    }
    counter += 1;
  }
}

function parseWorkbookSheets(workbookXml: string, relsXml: string) {
  const rels = new Map<string, string>();
  const relRegex = /<Relationship\b([^>]*)\/>/g;
  for (const match of relsXml.matchAll(relRegex)) {
    const attrs = match[1];
    const id = attrValue(attrs, "Id");
    const target = attrValue(attrs, "Target");
    if (id && target) {
      rels.set(id, target);
    }
  }

  const sheets: Array<{ name: string; path: string }> = [];
  const sheetRegex = /<sheet\b([^>]*)\/?>/g;
  for (const match of workbookXml.matchAll(sheetRegex)) {
    const attrs = match[1];
    const name = attrValue(attrs, "name");
    const rId = attrValue(attrs, "r:id") || attrValue(attrs, "id");
    if (name && rId) {
      const target = rels.get(rId);
      if (target) {
        sheets.push({ name, path: `xl/${target}` });
      }
    }
  }
  return sheets;
}

function buildWorkbook(sheets: Array<{ name: string; content: string }>) {
  const overrides = sheets.map((_, index) => 
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  
  const contentTypes = xml(`\
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${overrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);

  const sheetList = sheets.map((sheet, index) => 
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("");
  
  const workbookXml = xml(`\
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheetList}
  </sheets>
</workbook>`);

  const rels = sheets.map((_, index) => 
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  );
  const stylesRelId = `rId${sheets.length + 1}`;
  rels.push(`<Relationship Id="${stylesRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
  
  const workbookRels = xml(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels.join("")}
</Relationships>`);

  const filesList = [
    { path: "[Content_Types].xml", content: contentTypes },
    { path: "_rels/.rels", content: rootRelsXml() },
    { path: "xl/workbook.xml", content: workbookXml },
    { path: "xl/_rels/workbook.xml.rels", content: workbookRels },
    { path: "xl/styles.xml", content: stylesXml() },
  ];
  
  sheets.forEach((sheet, index) => {
    filesList.push({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      content: sheet.content,
    });
  });

  return buildZip(filesList);
}

export async function generateTestCasesExportXlsx(ctx?: ProjectAccessContext) {
  const params = new URLSearchParams({ limit: "10000" });
  const items = ctx?.isGuest || ctx?.userId === "guest-user"
    ? guestTestCases()
    : (await listTestCases(params, ctx)).items;

  // Group by module
  const groups: Record<string, TestCase[]> = {};
  for (const item of items) {
    const mod = (item.module || "General").trim();
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(item);
  }

  const sortedModules = Object.keys(groups).sort();
  if (sortedModules.length === 0) {
    sortedModules.push("General");
    groups["General"] = [];
  }

  const existingSheets = new Set<string>();
  const sheets = sortedModules.map(mod => {
    const name = sanitizeSheetName(mod, existingSheets);
    const rows = groups[mod].map(testCaseRow);
    return {
      name,
      content: worksheetXml(rows),
    };
  });

  return buildWorkbook(sheets);
}

export function generateTestCasesTemplateXlsx() {
  return buildWorkbook([{
    name: "Authentication",
    content: worksheetXml(templateRows(), { includeDataValidations: true, secondRowHeight: 60 }),
  }]);
}

type ImportError = {
  row: number;
  field: string;
  message: string;
};

type ParsedCellRow = string[];

function findEndOfCentralDirectory(buffer: Buffer) {
  const signature = 0x06054b50;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new Error("Invalid XLSX archive.");
}

function readZipFiles(buffer: Buffer) {
  const files = new Map<string, Buffer>();
  const endOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralOffset) !== 0x02014b50) break;

    const compressionMethod = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localHeaderOffset = buffer.readUInt32LE(centralOffset + 42);
    const fileName = buffer
      .subarray(centralOffset + 46, centralOffset + 46 + fileNameLength)
      .toString("utf8");

    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Invalid local header for ${fileName}.`);
    }

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

    if (compressionMethod === 0) {
      files.set(fileName, compressed);
    } else if (compressionMethod === 8) {
      files.set(fileName, inflateRawSync(compressed));
    } else {
      throw new Error(`Unsupported XLSX compression method: ${compressionMethod}.`);
    }

    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return files;
}

function decodeXml(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attrValue(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function textNodes(xmlValue: string) {
  const values: string[] = [];
  const textRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
  for (const match of xmlValue.matchAll(textRegex)) values.push(decodeXml(match[1]));
  return values.join("");
}

function tagValue(xmlValue: string, tag: string) {
  const match = xmlValue.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function columnIndexFromRef(ref: string) {
  const letters = (ref.match(/^[A-Z]+/i)?.[0] || "").toUpperCase();
  let value = 0;
  for (const letter of letters) value = value * 26 + letter.charCodeAt(0) - 64;
  return Math.max(value - 1, 0);
}

function parseSharedStrings(xmlValue?: string) {
  if (!xmlValue) return [];
  const values: string[] = [];
  const sharedRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  for (const match of xmlValue.matchAll(sharedRegex)) values.push(textNodes(match[1]));
  return values;
}

function parseWorksheetRows(sheetXml: string, sharedStrings: string[]): ParsedCellRow[] {
  const rows: ParsedCellRow[] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;

  for (const rowMatch of sheetXml.matchAll(rowRegex)) {
    const row: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    for (const cellMatch of rowMatch[1].matchAll(cellRegex)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const index = columnIndexFromRef(attrValue(attrs, "r"));
      const type = attrValue(attrs, "t");
      let value = "";

      if (type === "s") {
        value = sharedStrings[Number.parseInt(tagValue(body, "v") || "0", 10)] || "";
      } else if (type === "inlineStr") {
        value = textNodes(body);
      } else {
        value = tagValue(body, "v") || textNodes(body);
      }

      row[index] = value.trim();
    }
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\s+/g, " ")
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

function valueAt(row: ParsedCellRow, headers: ParsedCellRow, aliases: string[]) {
  const index = headerIndex(headers, aliases);
  return index >= 0 ? (row[index] || "").trim() : "";
}

function parseTags(value: string) {
  return value
    ? value.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean)
    : undefined;
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

export async function parseTestCasesImportXlsx(buffer: Buffer, ctx?: ProjectAccessContext) {
  const files = readZipFiles(buffer);
  
  const workbookXmlStr = files.get("xl/workbook.xml")?.toString("utf8");
  const relsXmlStr = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbookXmlStr || !relsXmlStr) {
    throw new Error("Invalid XLSX file structure.");
  }

  const sheets = parseWorkbookSheets(workbookXmlStr, relsXmlStr);
  if (sheets.length === 0) {
    const defaultSheet = files.get("xl/worksheets/sheet1.xml");
    if (defaultSheet) {
      sheets.push({ name: "Test Cases", path: "xl/worksheets/sheet1.xml" });
    }
  }

  const REQUIRED_COLUMNS_SET = new Set([
    COL.title,
    COL.type,
    COL.severity,
    COL.expectedResult,
    COL.stepActions,
  ].map(s => s.toLowerCase()));

  const errors: ImportError[] = [];
  const validRows: any[] = [];
  const duplicates: any[] = [];
  let totalParsed = 0;

  const existingItems = ctx?.isGuest || ctx?.userId === "guest-user"
    ? guestTestCases()
    : (await listTestCases(new URLSearchParams({ limit: "10000" }), ctx)).items;
  const existingByDisplayId = new Map(existingItems.map((item) => [item.id.toLowerCase(), item]));

  for (const sheetInfo of sheets) {
    const sheetContent = files.get(sheetInfo.path);
    if (!sheetContent) continue;

    const sharedStrings = parseSharedStrings(files.get("xl/sharedStrings.xml")?.toString("utf8"));
    const rows = parseWorksheetRows(sheetContent.toString("utf8"), sharedStrings);
    const headers = rows[0] || [];
    const dataRows = rows.slice(1).filter((row) => row.some((value) => String(value || "").trim()));

    const normalizedHeaders = headers.map(normalizeHeader);
    const hasMatch = normalizedHeaders.some(h => REQUIRED_COLUMNS_SET.has(h));
    if (!hasMatch) {
      continue;
    }

    const missing = [COL.title, COL.type, COL.severity, COL.expectedResult, COL.stepActions]
      .filter(col => !normalizedHeaders.includes(col.toLowerCase()));

    if (missing.length > 0) {
      errors.push({
        row: 0,
        field: `Sheet '${sheetInfo.name}' Header`,
        message: `Missing required columns: ${missing.join(", ")}.`,
      });
      continue;
    }

    totalParsed += dataRows.length;

    if (totalParsed > 500) {
      errors.push({
        row: 0,
        field: "file",
        message: "Only the first 500 rows across all sheets can be imported at once.",
      });
      break;
    }

    dataRows.forEach((row, index) => {
      const rowNumber = index + 2;
      const rowErrors: ImportError[] = [];
      const displayId = valueAt(row, headers, [COL.displayId, "ID", "Display ID"]);
      const title = valueAt(row, headers, [COL.title]);
      
      const hasModuleHeader = normalizedHeaders.includes("module");
      const moduleVal = hasModuleHeader ? valueAt(row, headers, ["Module"]) : "";
      const module = moduleVal || sheetInfo.name;

      const type = valueAt(row, headers, [COL.type]) || "Functional";
      const severity = valueAt(row, headers, [COL.severity]) || "Major";
      const status = valueAt(row, headers, [COL.status]) || "Draft";
      const automationStatus = valueAt(row, headers, [COL.automationStatus]) || "Manual";
      const environment = valueAt(row, headers, [COL.environment]);

      if (!title) {
        rowErrors.push({ row: rowNumber, field: "Title", message: `Title is required (in sheet '${sheetInfo.name}').` });
      }
      validateChoiceInSheet(rowErrors, rowNumber, "Type", type, VALID_TYPES, sheetInfo.name);
      validateChoiceInSheet(rowErrors, rowNumber, "Severity", severity, VALID_SEVERITIES, sheetInfo.name);
      validateChoiceInSheet(rowErrors, rowNumber, "Status", status, VALID_STATUSES, sheetInfo.name);
      validateChoiceInSheet(rowErrors, rowNumber, "Automation Status", automationStatus, VALID_AUTOMATION_STATUSES, sheetInfo.name);

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        return;
      }

      const parsedRow = {
        rowIndex: rowNumber,
        displayId: displayId || undefined,
        display_id: displayId || undefined,
        title,
        module,
        type,
        severity,
        status,
        description: valueAt(row, headers, [COL.description]) || undefined,
        preconditions: valueAt(row, headers, [COL.preconditions]) || undefined,
        testSteps: parseSteps(valueAt(row, headers, [COL.stepActions, "Steps"])),
        expectedResult: valueAt(row, headers, [COL.expectedResult]) || undefined,
        notes: valueAt(row, headers, [COL.notes]) || undefined,
        automationStatus,
        environment: environment || undefined,
        estimatedTime: valueAt(row, headers, [COL.estimatedTime]) || undefined,
        tags: parseTags(valueAt(row, headers, [COL.tags])),
        requirementId: valueAt(row, headers, [COL.requirementId]) || undefined,
        assignedTo: valueAt(row, headers, [COL.assignedTo]) || undefined,
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
  }

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
