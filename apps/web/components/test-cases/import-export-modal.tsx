"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

interface ValidRow {
  rowIndex: number;
  displayId?: string;
  [key: string]: unknown;
}

interface DuplicateRow {
  rowIndex: number;
  displayId: string;
  importTitle: string;
  existingTitle: string;
  existingStatus: string;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
}

interface ParseResult {
  totalParsed: number;
  validRows: ValidRow[];
  duplicates: DuplicateRow[];
  errors: ImportError[];
}

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParseSuccess: (result: ParseResult) => void;
  onImportError: (message: string) => void;
  totalCount: number;
}

export function ImportExportModal({
  isOpen,
  onClose,
  onParseSuccess,
  onImportError,
  totalCount,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportScope, setExportScope] = useState<"all" | "module" | "scenario">("all");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedScenario, setSelectedScenario] = useState("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [availableScenarios, setAvailableScenarios] = useState<string[]>([]);

  // Fetch modules and scenarios when needed
  useEffect(() => {
    if (activeTab === "export" && isOpen) {
      fetch("/api/test-cases/modules")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAvailableModules(data);
        })
        .catch((err) => console.error("Failed to fetch modules:", err));

      fetch("/api/test-cases/scenarios")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAvailableScenarios(data);
        })
        .catch((err) => console.error("Failed to fetch scenarios:", err));
    }
  }, [activeTab, isOpen]);

  function handleExport() {
    window.location.href = "/api/test-cases/export/xlsx";
  }

  function handleDownloadTemplate() {
    window.location.href = "/api/test-cases/template/xlsx";
  }

  async function processFile(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      setValidationError("Only Excel (.xlsx) files are supported.");
      return;
    }
    setValidationError(null);
    setIsParsing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/test-cases/import/parse", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (!res.ok) {
        onImportError(result.error ?? "Failed to parse the file.");
        onClose();
        return;
      }

      const normalized: ParseResult = {
        totalParsed: result.total_parsed,
        validRows: result.valid_rows,
        duplicates: (result.duplicates ?? []).map((d: any) => ({
          rowIndex: d.row_index,
          displayId: d.display_id,
          importTitle: d.import_title,
          existingTitle: d.existing_title,
          existingStatus: d.existing_status,
        })),
        errors: (result.errors ?? []).map((e: any) => ({
          row: e.row,
          field: e.field,
          message: e.message,
        })),
      };

      if (normalized.validRows.length === 0 && normalized.duplicates.length === 0) {
        onImportError(`No importable rows found. ${normalized.errors.length} error(s).`);
        onClose();
        return;
      }

      onParseSuccess(normalized);
      onClose();
    } catch (err: any) {
      onImportError(err.message ?? "An error occurred during parsing.");
      onClose();
    } finally {
      setIsParsing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" preventClose={isParsing} className="overflow-visible">
      <ModalHeader onClose={onClose} closeDisabled={isParsing}>
        <ModalTitle>Import / Export Test Cases</ModalTitle>
      </ModalHeader>

      {/* Tab Selection */}
      <div className="flex border-b border-outline-variant px-5 bg-surface-container-low/10">
        <button
          onClick={() => { if (!isParsing) setActiveTab("import"); }}
          disabled={isParsing}
          className={cn(
            "px-3 py-2 text-body-md font-medium border-b-2 transition-all focus:outline-none",
            activeTab === "import"
              ? "border-primary-container text-primary-container"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
          )}
        >
          Import
        </button>
        <button
          onClick={() => { if (!isParsing) setActiveTab("export"); }}
          disabled={isParsing}
          className={cn(
            "px-3 py-2 text-body-md font-medium border-b-2 transition-all focus:outline-none",
            activeTab === "export"
              ? "border-primary-container text-primary-container"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
          )}
        >
          Export
        </button>
      </div>

      <ModalBody>
        {activeTab === "import" ? (
          <div className="space-y-4">
            {/* Drag-and-drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isParsing && fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                isDragging
                  ? "border-primary-container bg-primary-container/5 scale-[0.99]"
                  : "border-outline-variant hover:border-primary-container hover:bg-surface-container-low/40",
                isParsing && "pointer-events-none opacity-45"
              )}
            >
              <input
                id="import-xlsx-file-input"
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isParsing}
              />

              {isParsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary-container animate-spin" />
                  <p className="text-body-sm font-medium text-on-surface">Uploading and parsing file...</p>
                  <p className="text-caption text-outline">Checking formatting, severities, and duplicates</p>
                </div>
              ) : (
                <>
                  <div className="p-2.5 bg-primary-container/5 rounded-full mb-2 text-primary-container">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-body-sm font-semibold text-on-surface">
                    Drag and drop your spreadsheet here
                  </p>
                  <p className="text-caption text-on-surface-variant mt-1">
                    or click to browse (.xlsx)
                  </p>
                  <p className="text-label-sm text-outline mt-2.5 uppercase tracking-wide">
                    Max 500 rows
                  </p>
                </>
              )}
            </div>

            {validationError && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-error/5 border border-error/20 text-error text-caption animate-fade-in">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Guidelines / Helper details */}
            <div className="text-caption text-on-surface-variant space-y-1 bg-surface-container-low/40 p-3 rounded-md border border-outline-variant/50">
              <span className="font-semibold text-on-surface block mb-0.5">Required Columns & Format:</span>
              <p>
                • Columns: <code className="font-mono text-primary-container">ID, Title, Severity, Status, Type, Preconditions, Steps, Expected Result</code>.
              </p>
              <p>
                • Sheet Name: <span className="text-on-surface font-medium">Each sheet corresponds to a Module</span> (e.g. sheet name "Authentication" will group cases into that module).
              </p>
              <p>
                • Severities: <code className="font-mono text-primary-container">Minor, Major, Critical, Blocker</code>.
              </p>
            </div>

            {/* Template Download Section */}
            <div className="border border-outline-variant/60 bg-surface-container-low/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors hover:border-outline-variant">
              <div className="space-y-0.5">
                <span className="font-semibold text-caption text-on-surface block">Need a template?</span>
                <span className="text-caption text-on-surface-variant block">
                  Download our formatted Excel template to ensure accurate column validation.
                </span>
              </div>
              <Button
                id="download-template-btn"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                disabled={isParsing}
                className="whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5 text-center max-w-sm mx-auto">
              <div className="inline-flex p-2.5 bg-primary-container/5 rounded-full text-primary-container mb-0.5">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-body-md font-semibold text-on-surface">Export All Test Cases</h3>
              <p className="text-caption text-on-surface-variant">
                Generate and download an Excel sheet containing all {totalCount} test cases configured in the system.
              </p>
            </div>

            <div className="bg-surface-container-low/40 border border-outline-variant/50 rounded-lg p-3 text-caption text-on-surface-variant space-y-1">
              <span className="font-semibold text-on-surface block">Included in Export:</span>
              <p>• Full test case metadata including ID, title, module, severity, status, and type.</p>
              <p>• Complete execution steps, preconditions, and expected results.</p>
              <p>• Auto-fit columns and clean header formatting.</p>
            </div>

            {/* Export Scope Options */}
            <div className="space-y-2 mt-4">
              <label className="text-body-sm font-medium text-on-surface block">Export Scope</label>
              <select
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary/50 outline-none"
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value as "all" | "module" | "scenario")}
              >
                <option value="all">All Test Cases</option>
                <option value="module">Specific Module...</option>
                <option value="scenario">Specific Scenario...</option>
              </select>

              {exportScope === "module" && (
                <div className="pt-2 animate-fade-in">
                  <Combobox
                    value={selectedModule}
                    onChange={setSelectedModule}
                    options={availableModules}
                    placeholder="Select or type module..."
                  />
                </div>
              )}
              {exportScope === "scenario" && (
                <div className="pt-2 animate-fade-in">
                  <Combobox
                    value={selectedScenario}
                    onChange={setSelectedScenario}
                    options={availableScenarios}
                    placeholder="Select or type scenario..."
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant/40 mt-4">
              <Button
                id="export-xlsx-btn"
                onClick={handleExport}
                className="w-full sm:w-auto flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Test Cases
              </Button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
