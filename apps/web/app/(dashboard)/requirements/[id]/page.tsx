"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ChevronLeft, Edit, Link2 } from "lucide-react";
import { TraceabilityMatrix } from "@/components/requirements/traceability-matrix";
import { RequirementComments } from "@/components/requirements/requirement-comments";
import { RequirementSidebar } from "@/components/requirements/requirement-sidebar";
import { AIAnalysisPanel } from "@/components/requirements/ai-analysis-panel";
import { LinkTestCasesModal } from "@/components/requirements/link-test-cases-modal";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import type { Requirement } from "@/lib/types";

type LinkedTestCase = {
  id: string;
  realId?: string;
  displayId?: string;
  title: string;
  module?: string;
  severity?: string;
  status: string;
  type?: string;
};

function readStoredGuestRequirement(id: string) {
  try {
    const stored = sessionStorage.getItem(`guest-requirement:${id}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    sessionStorage.removeItem(`guest-requirement:${id}`);
    return null;
  }
}

function requirementStatusVariant(status: Requirement["status"]): BadgeVariant {
  if (status === "In Review") return "in-review";
  if (status === "Baseline") return "approved";
  if (status === "Archived") return "obsolete";
  return status.toLowerCase() as BadgeVariant;
}

export default function RequirementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkedTestCases, setLinkedTestCases] = useState<LinkedTestCase[] | null>(null);

  useEffect(() => {
    async function loadReq() {
      try {
        const storedRequirement = readStoredGuestRequirement(id);
        if (storedRequirement) {
          setRequirement(storedRequirement);
        }

        const response = await fetch(`/api/requirements/${id}`);
        if (response.ok) {
          const loaded = await response.json();
          setRequirement(storedRequirement ? { ...loaded, ...storedRequirement } : loaded);
        }
        
        const tcResponse = await fetch(`/api/requirements/${id}/test-cases`);
        if (tcResponse.ok) {
          setLinkedTestCases(await tcResponse.json());
        }
      } catch (error) {
        console.error("Failed to load requirement data", error);
      }
    }
    loadReq();
  }, [id]);


  if (!requirement) {
    return <PageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center text-body-sm text-outline hover:text-on-surface transition-colors cursor-pointer w-fit mb-2">
        <Link href="/requirements" className="flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Requirements
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-display-sm font-semibold text-on-surface">
              {requirement.displayId}: {requirement.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={requirement.priority.toLowerCase() as BadgeVariant}>{requirement.priority}</Badge>
            <Badge variant={requirementStatusVariant(requirement.status)}>{requirement.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/requirements/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setIsLinkModalOpen(true)}>
            <Link2 className="h-4 w-4 mr-2" /> Link Test Case
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle space-y-4 shrink-0">
            <div>
              <h3 className="text-body-lg font-semibold mb-2">Description</h3>
              <p className="text-on-surface-variant whitespace-pre-wrap">
                {requirement.description || "No description provided."}
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/50">
              <h3 className="text-body-lg font-semibold mb-2">Acceptance Criteria</h3>
              <p className="text-on-surface-variant whitespace-pre-wrap">
                {requirement.acceptanceCriteria || "No acceptance criteria defined."}
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/50">
              <h3 className="text-body-lg font-semibold mb-2">Business Rules</h3>
              <p className="text-on-surface-variant whitespace-pre-wrap">
                {requirement.businessRules || "No business rules defined."}
              </p>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle flex-1 flex flex-col">
            <TraceabilityMatrix requirement={requirement} linkedTestCasesOverride={linkedTestCases || undefined} />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="shrink-0">
            <RequirementSidebar requirement={requirement} />
          </div>

          <div className="shrink-0">
            <AIAnalysisPanel
              requirementId={id as string}
              title={requirement.title}
              description={requirement.description}
              acceptanceCriteria={requirement.acceptanceCriteria}
              businessRules={requirement.businessRules}
              module={requirement.module}
              type={requirement.type}
              priority={requirement.priority}
            />
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle flex-1 flex flex-col">
            <RequirementComments requirementId={id as string} />
          </div>
        </div>
      </div>

      <LinkTestCasesModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        requirementId={id as string}
        linkedTestCaseIds={(linkedTestCases || []).map(tc => tc.id)}
        onLink={async (tcId) => {
          const res = await fetch(`/api/requirements/${id}/test-cases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testCaseId: tcId }),
          });
          if (res.ok) {
            const payload = await res.json().catch(() => ({}));
            const testCase = payload.testCase || {
              id: tcId,
              displayId: tcId,
              title: tcId,
              status: "Ready",
            };
            setLinkedTestCases((current) =>
              (current || []).some((tc) => tc.id === tcId || tc.displayId === tcId)
                ? current
                : [...(current || []), testCase],
            );
          }
        }}
        onUnlink={async (tcId) => {
          const res = await fetch(`/api/requirements/${id}/test-cases?testCaseId=${encodeURIComponent(tcId)}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setLinkedTestCases((current) => (current || []).filter((tc) => tc.id !== tcId && tc.displayId !== tcId));
          }
        }}
      />
    </div>
  );
}
