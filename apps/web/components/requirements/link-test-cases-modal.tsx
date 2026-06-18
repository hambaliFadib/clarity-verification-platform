"use client";

import { useState, useEffect } from "react";
import { Search, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";

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
        const data = await response.json();
        setTestCases(Array.isArray(data) ? data : data.items || []);
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
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Link Test Cases</ModalTitle>
      </ModalHeader>

      <div className="px-6 py-3 border-b border-outline-variant">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            type="text"
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-md text-body-sm bg-card focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all"
          />
        </div>
      </div>

      <ModalBody className="overflow-y-auto max-h-[50vh]">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-surface-container-low rounded-md" />
            ))}
          </div>
        ) : filteredTestCases.length === 0 ? (
          <p className="text-center text-outline py-8">No test cases found</p>
        ) : (
          <div className="space-y-2">
            {filteredTestCases.map((tc) => (
              <div
                key={tc.id}
                className={`flex items-center justify-between p-3 border rounded-md transition-colors ${
                  isLinked(tc.id)
                    ? "border-success bg-success/5"
                    : "border-outline-variant hover:bg-surface-container-low"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-body-sm">{tc.displayId}</span>
                    <span className="text-body-sm text-on-surface-variant">{tc.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{tc.module}</Badge>
                    <Badge variant={statusVariant(tc.status)}>
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
                      <Unlink className="h-4 w-4" /> Unlink
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" /> Link
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  );
}
