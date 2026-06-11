"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, AlertTriangle, CheckCircle2, SkipForward, RefreshCw } from "lucide-react";

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

interface ValidRow {
  rowIndex: number;
  displayId?: string;
  [key: string]: unknown;
}

interface ParseResult {
  totalParsed: number;
  validRows: ValidRow[];
  duplicates: DuplicateRow[];
  errors: ImportError[];
}

interface ImportResult {
  created: number;
  skipped: number;
  overwritten: number;
  errors: ImportError[];
}

interface Props {
  isOpen: boolean;
  parseResult: ParseResult | null;
  onClose: () => void;
  onComplete: (result: ImportResult) => void;
}

type DuplicateActionType = "skip" | "overwrite";

export function ImportReviewModal({ isOpen, parseResult, onClose, onComplete }: Props) {
  const [duplicateActions, setDuplicateActions] = useState<Record<string, DuplicateActionType>>({});
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen || !parseResult) return null;

  const { totalParsed, validRows, duplicates, errors } = parseResult;
  const newRowCount = validRows.length - duplicates.length;

  function setActionForAll(action: DuplicateActionType) {
    const next: Record<string, DuplicateActionType> = {};
    for (const dup of duplicates) {
      next[dup.displayId] = action;
    }
    setDuplicateActions(next);
  }

  function toggleAction(displayId: string) {
    setDuplicateActions((prev) => ({
      ...prev,
      [displayId]: prev[displayId] === "overwrite" ? "skip" : "overwrite",
    }));
  }

  async function handleExecute() {
    setIsExecuting(true);
    try {
      const payload = {
        rows: validRows,
        duplicateActions: duplicates.map((dup) => ({
          displayId: dup.displayId,
          action: duplicateActions[dup.displayId] ?? "skip",
        })),
      };
      const res = await fetch("/api/test-cases/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: ImportResult = await res.json();
      onComplete(result);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface-container rounded-2xl shadow-2xl border border-outline-variant w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-semibold text-on-surface">Import Review</h2>
          <button
            id="import-review-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <X className="h-4 w-4 text-on-surface-variant" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div className="flex gap-6 text-body-sm">
            <span className="text-on-surface-variant">
              Parsed: <span className="font-semibold text-on-surface">{totalParsed}</span>
            </span>
            <span className="text-emerald-600">
              New: <span className="font-semibold">{newRowCount}</span>
            </span>
            {duplicates.length > 0 && (
              <span className="text-amber-600">
                Duplicates: <span className="font-semibold">{duplicates.length}</span>
              </span>
            )}
            {errors.length > 0 && (
              <span className="text-error">
                Errors: <span className="font-semibold">{errors.length}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {errors.length > 0 && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-error text-body-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Validation Errors — these rows will not be imported
              </div>
              <ul className="space-y-1">
                {errors.map((err, idx) => (
                  <li key={idx} className="text-body-sm text-error/80">
                    Row {err.row} · <span className="font-mono">{err.field}</span>: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {duplicates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 text-body-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Duplicate Test Cases — choose action per row
                </div>
                <div className="flex gap-2">
                  <Button
                    id="import-skip-all-btn"
                    variant="outline"
                    className="h-7 px-3 text-[11px]"
                    onClick={() => setActionForAll("skip")}
                  >
                    <SkipForward className="h-3 w-3 mr-1" />
                    Skip All
                  </Button>
                  <Button
                    id="import-overwrite-all-btn"
                    variant="outline"
                    className="h-7 px-3 text-[11px]"
                    onClick={() => setActionForAll("overwrite")}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Overwrite All
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant overflow-hidden">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="text-left px-3 py-2 text-[11px] font-bold text-outline uppercase">ID</th>
                      <th className="text-left px-3 py-2 text-[11px] font-bold text-outline uppercase">Title (import)</th>
                      <th className="text-left px-3 py-2 text-[11px] font-bold text-outline uppercase">Title (existing)</th>
                      <th className="text-left px-3 py-2 text-[11px] font-bold text-outline uppercase">Status</th>
                      <th className="text-center px-3 py-2 text-[11px] font-bold text-outline uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50">
                    {duplicates.map((dup) => {
                      const action = duplicateActions[dup.displayId] ?? "skip";
                      return (
                        <tr key={dup.displayId} className="hover:bg-surface-container-low/50">
                          <td className="px-3 py-2 font-mono text-code text-primary-container">{dup.displayId}</td>
                          <td className="px-3 py-2 text-on-surface max-w-[150px] truncate">{dup.importTitle}</td>
                          <td className="px-3 py-2 text-on-surface-variant max-w-[150px] truncate">{dup.existingTitle}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-[10px]">{dup.existingStatus}</Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              id={`dup-action-${dup.displayId}`}
                              onClick={() => toggleAction(dup.displayId)}
                              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                                action === "overwrite"
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30"
                              }`}
                            >
                              {action === "overwrite" ? "Overwrite" : "Skip"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {duplicates.length === 0 && errors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-body-md font-medium text-on-surface">
                {newRowCount} test {newRowCount === 1 ? "case" : "cases"} ready to import
              </p>
              <p className="text-body-sm text-on-surface-variant">No duplicates or errors found.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant">
            {newRowCount} new &middot; {duplicates.filter((d) => (duplicateActions[d.displayId] ?? "skip") === "overwrite").length} will overwrite &middot;{" "}
            {duplicates.filter((d) => (duplicateActions[d.displayId] ?? "skip") === "skip").length} will skip
          </p>
          <div className="flex gap-3">
            <Button id="import-review-cancel-btn" variant="outline" onClick={onClose} disabled={isExecuting}>
              Cancel
            </Button>
            <Button
              id="import-review-confirm-btn"
              onClick={handleExecute}
              disabled={isExecuting || (newRowCount === 0 && duplicates.every((d) => (duplicateActions[d.displayId] ?? "skip") === "skip"))}
            >
              {isExecuting ? "Importing..." : "Confirm Import"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
