"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, SkipForward, RefreshCw } from "lucide-react";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";
import { DataTable, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/data-table";

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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" preventClose={isExecuting}>
      <ModalHeader onClose={onClose} closeDisabled={isExecuting}>
        <ModalTitle>Import Review</ModalTitle>
      </ModalHeader>

      <div className="px-6 py-3 border-b border-outline-variant bg-surface-container-low">
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

      <ModalBody className="overflow-y-auto max-h-[50vh] space-y-4">
        {errors.length > 0 && (
          <div className="rounded-lg border border-error/30 bg-error/5 p-4 space-y-2">
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
                  size="sm"
                  onClick={() => setActionForAll("skip")}
                >
                  <SkipForward className="h-3 w-3" />
                  Skip All
                </Button>
                <Button
                  id="import-overwrite-all-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setActionForAll("overwrite")}
                >
                  <RefreshCw className="h-3 w-3" />
                  Overwrite All
                </Button>
              </div>
            </div>

            <DataTable>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>ID</TableHeaderCell>
                  <TableHeaderCell>Title (import)</TableHeaderCell>
                  <TableHeaderCell>Title (existing)</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-center">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {duplicates.map((dup) => {
                  const action = duplicateActions[dup.displayId] ?? "skip";
                  return (
                    <TableRow key={dup.displayId}>
                      <TableCell className="font-mono text-code text-primary-container">{dup.displayId}</TableCell>
                      <TableCell className="text-on-surface max-w-[150px] truncate">{dup.importTitle}</TableCell>
                      <TableCell className="text-on-surface-variant max-w-[150px] truncate">{dup.existingTitle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{dup.existingStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          id={`dup-action-${dup.displayId}`}
                          onClick={() => toggleAction(dup.displayId)}
                          className={`px-3 py-1 rounded-md text-caption font-medium transition-colors ${
                            action === "overwrite"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30"
                          }`}
                        >
                          {action === "overwrite" ? "Overwrite" : "Skip"}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
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
      </ModalBody>

      <ModalFooter className="justify-between">
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
      </ModalFooter>
    </Modal>
  );
}
