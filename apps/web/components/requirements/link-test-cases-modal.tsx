"use client";

import { useState, useEffect } from "react";
import { X, Search, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

interface TestCase {
  id: string;
  displayId: string;
  title: string;
  module: string;
  status: string;
  severity: string;
}

interface LinkTestCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirementId: string;
  linkedTestCaseIds: string[];
  onLink: (testCaseId: string) => Promise<void>;
  onUnlink: (testCaseId: string) => Promise<void>;
}

function statusVariant(status: string): BadgeVariant {
  const normalized = status.toLowerCase().replace(/\s+/g, "-");
  if (normalized === "in-review") return "in-review";
  if (normalized === "approved") return "approved";
  if (normalized === "ready") return "ready";
  if (normalized === "draft") return "draft";
  if (normalized === "obsolete") return "obsolete";
  return "outline";
}

export function LinkTestCasesModal({
  isOpen,
  onClose,
  requirementId,
  linkedTestCaseIds,
  onLink,
  onUnlink,
}: LinkTestCasesModalProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTestCases();
    }
  }, [isOpen]);

  const fetchTestCases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-cases");
      if (response.ok) {
        setTestCases(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch test cases", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async (tcId: string) => {
    setProcessingId(tcId);
    try {
      await onLink(tcId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnlink = async (tcId: string) => {
    setProcessingId(tcId);
    try {
      await onUnlink(tcId);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredTestCases = testCases.filter((tc) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        tc.displayId.toLowerCase().includes(q) ||
        tc.title.toLowerCase().includes(q) ||
        tc.module.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const isLinked = (tcId: string) => linkedTestCaseIds.includes(tcId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-elevated flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm font-semibold">Link Test Cases</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-outline-variant">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
            <input
              type="text"
              placeholder="Search test cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-surface-container-low rounded-lg" />
              ))}
            </div>
          ) : filteredTestCases.length === 0 ? (
            <p className="text-center text-outline py-8">No test cases found</p>
          ) : (
            <div className="space-y-2">
              {filteredTestCases.map((tc) => (
                <div
                  key={tc.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    isLinked(tc.id)
                      ? "border-success bg-success/5"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tc.displayId}</span>
                      <span className="text-sm text-on-surface-variant">{tc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{tc.module}</Badge>
                      <Badge variant={statusVariant(tc.status)} className="text-xs">
                        {tc.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant={isLinked(tc.id) ? "outline" : "default"}
                    size="sm"
                    onClick={() => isLinked(tc.id) ? handleUnlink(tc.id) : handleLink(tc.id)}
                    disabled={processingId === tc.id}
                  >
                    {isLinked(tc.id) ? (
                      <>
                        <Unlink className="h-4 w-4 mr-1" /> Unlink
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4 mr-1" /> Link
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant flex justify-end">
          <Button variant="outline" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
