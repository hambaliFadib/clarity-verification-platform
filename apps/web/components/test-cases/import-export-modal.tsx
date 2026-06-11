"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-40 flex items-start justify-center p-4 pt-20 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isParsing ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-elevated flex flex-col overflow-hidden animate-scale-in border border-outline-variant">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant bg-surface-container-low/30">
          <h2 className="text-title-md font-headline font-semibold text-on-surface">
            Import / Export Test Cases
          </h2>
          <button
            onClick={onClose}
            disabled={isParsing}
            className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant px-5 bg-surface-container-low/10">
          <button
            onClick={() => {
              if (!isParsing) setActiveTab("import");
            }}
            disabled={isParsing}
            className={`px-3 py-2 text-label-bold font-label-bold border-b-2 text-body-sm transition-all focus:outline-none ${
              activeTab === "import"
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
            }`}
          >
            Import
          </button>
          <button
            onClick={() => {
              if (!isParsing) setActiveTab("export");
            }}
            disabled={isParsing}
            className={`px-3 py-2 text-label-bold font-label-bold border-b-2 text-body-sm transition-all focus:outline-none ${
              activeTab === "export"
                ? "border-primary-container text-primary-container"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
            }`}
          >
            Export
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5">
          {activeTab === "import" ? (
            <div className="space-y-4">
              {/* Drag-and-drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary-container bg-primary-container/5 scale-[0.99]"
                    : "border-outline-variant hover:border-primary-container hover:bg-surface-container-low/40"
                } ${isParsing ? "pointer-events-none opacity-45" : ""}`}
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
                    <p className="text-[11px] text-outline">Checking formatting, severities, and duplicates</p>
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 bg-primary-container/5 rounded-full mb-2 text-primary-container">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-body-sm font-semibold text-on-surface">
                      Drag and drop your spreadsheet here
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      or click to browse (.xlsx)
                    </p>
                    <p className="text-[10px] text-outline mt-2.5 uppercase tracking-wide">
                      Max 500 rows
                    </p>
                  </>
                )}
              </div>

              {validationError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-error/5 border border-error/20 text-error text-xs animate-fade-in">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Guidelines / Helper details */}
              <div className="text-[11px] text-on-surface-variant space-y-1 bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/50">
                <span className="font-semibold text-on-surface block mb-0.5">Required Columns & Format:</span>
                <p>
                  • Columns: <code className="font-mono text-primary-container">ID, Title, Module, Severity, Status, Type, Preconditions, Steps, Expected Result</code>.
                </p>
                <p>
                  • Severities: <code className="font-mono text-primary-container">Minor, Major, Critical, Blocker</code>.
                </p>
              </div>

              {/* Template Download Section */}
              <div className="border border-outline-variant/60 bg-surface-container-low/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors hover:border-outline-variant">
                <div className="space-y-0.5">
                  <span className="font-semibold text-xs text-on-surface block">Need a template?</span>
                  <span className="text-[11px] text-on-surface-variant block">
                    Download our formatted Excel template to ensure accurate column validation.
                  </span>
                </div>
                <Button
                  id="download-template-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={isParsing}
                  className="whitespace-nowrap flex items-center gap-1.5 self-start sm:self-auto h-8 text-[11px]"
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
                <h3 className="text-body-sm font-semibold text-on-surface">Export All Test Cases</h3>
                <p className="text-xs text-on-surface-variant">
                  Generate and download an Excel sheet containing all {totalCount} test cases configured in the system.
                </p>
              </div>

              <div className="bg-surface-container-low/40 border border-outline-variant/50 rounded-xl p-3 text-[11px] text-on-surface-variant space-y-1">
                <span className="font-semibold text-on-surface block">Included in Export:</span>
                <p>• Full test case metadata including ID, title, module, severity, status, and type.</p>
                <p>• Complete execution steps, preconditions, and expected results.</p>
                <p>• Auto-fit columns and clean header formatting.</p>
              </div>

              <div className="flex justify-end pt-2 border-t border-outline-variant/40">
                <Button
                  id="export-xlsx-btn"
                  onClick={handleExport}
                  className="w-full sm:w-auto flex items-center gap-2 h-9 text-body-sm text-white"
                >
                  <Download className="h-4 w-4" />
                  Export {totalCount} Test Cases
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
