"use client";

import { useState } from "react";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "import" | "export";
}

export function ImportExportModal({ isOpen, onClose, type }: ImportExportModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Requirements imported successfully!");
      onClose();
    }, 2000);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Export started. Check your downloads.");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={isProcessing ? undefined : onClose} />

      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-elevated flex flex-col border border-outline-variant animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
            {type === "import" ? "Import Requirements" : "Export Requirements"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {type === "import" ? (
            <div className="space-y-4">
              <p className="text-body-sm text-on-surface-variant">
                Upload a CSV, Excel, Word, PDF, Markdown, or Text file containing your requirements. Make sure to follow the standard template format.
              </p>
              
              <div 
                className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low transition-colors"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .doc, .docx, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf, .md, text/markdown, .txt, text/plain"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
                <Upload className="h-8 w-8 text-primary mb-3" />
                <span className="text-body-md font-medium text-on-surface mb-1">
                  {selectedFile ? selectedFile.name : "Click to upload file"}
                </span>
                <span className="text-body-sm text-outline">
                  CSV, XLSX, DOCX, PDF, MD, TXT (Max 5MB)
                </span>
              </div>
              
              <Button variant="outline" className="w-full text-primary" onClick={() => toast.info("Downloading template...")}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-body-sm text-on-surface-variant">
                Export all requirements and their metadata. You can use this file for backup or external reporting.
              </p>
              <div className="bg-surface-container-low p-4 rounded-lg flex items-center gap-3">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-medium text-body-md">requirements_export.csv</div>
                  <div className="text-body-sm text-outline">Contains title, module, status, priority, etc.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low/30 rounded-b-2xl">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={type === "import" ? handleImport : handleExport}
            disabled={type === "import" && !selectedFile}
            loading={isProcessing}
          >
            {type === "import" ? "Start Import" : "Export Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
