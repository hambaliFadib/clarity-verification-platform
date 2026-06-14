"use client";
import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Globe, Monitor, Link2, Tag, MessageSquare, Plus, Check } from "lucide-react";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  getDefectStatusBadgeVariant,
  priorityBadgeVariants,
  severityBadgeVariants,
} from "@/lib/badge-variants";
import { LinkTestCaseModal } from "@/components/defects/link-test-case-modal";
import { ReportDefectModal } from "@/components/defects/report-defect-modal";
import type { Defect, DefectComment, DefectStatus, TeamMember, TestCase } from "@/lib/types";

export default function DefectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const { id } = use(params);
  const [defect, setDefect] = useState<Defect | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<DefectComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [linkedTestCases, setLinkedTestCases] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      const [defectResponse, usersResponse, testCasesResponse] = await Promise.all([
        fetch(`/api/defects/${id}`, { cache: "no-store" }),
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/test-cases", { cache: "no-store" }),
      ]);

      if (!isMounted) return;
      if (defectResponse.ok) {
        const data: Defect = await defectResponse.json();
        setDefect(data);
        setComments(data.comments || []);
        setLinkedTestCases(data.linkedTestCase ? [data.linkedTestCase] : []);
      }
      if (usersResponse.ok) setTeamMembers(await usersResponse.json());
      if (testCasesResponse.ok) setTestCases(await testCasesResponse.json());
      setIsLoading(false);
    }

    loadDetail().catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-body-md text-on-surface-variant">
        Loading defect...
      </div>
    );
  }

  if (!defect) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Defect Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">The defect &quot;{id}&quot; does not exist.</p>
        <Link href="/defects" className="text-primary-container hover:underline mt-4 inline-block">Back to Defects</Link>
      </div>
    );
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    const currentUser = {
      name: sessionUser?.name || teamMembers[0]?.name || "System",
      initials: sessionUser?.initials || teamMembers[0]?.initials || "??",
    };
    const response = await fetch(`/api/defects/${defect.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: currentUser.name,
        initials: currentUser.initials,
        text: newComment.trim(),
      }),
    });

    if (!response.ok) return;
    const result = await response.json();
    const comment: DefectComment = result.comment || {
      id: `c${Date.now()}`,
      author: currentUser.name,
      initials: currentUser.initials,
      timestamp: new Date().toISOString(),
      text: newComment.trim()
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleEditDefect = async (updatedDefect: Defect) => {
    const payload = {
      title: updatedDefect.title,
      description: updatedDefect.description,
      severity: updatedDefect.severity,
      status: updatedDefect.status,
      type: updatedDefect.type,
      priority: updatedDefect.priority,
      assigned_to: updatedDefect.assignedTo,
      reported_by: updatedDefect.reportedBy,
      linked_test_case: updatedDefect.linkedTestCase,
      linked_test_run: updatedDefect.linkedTestRun,
      environment: updatedDefect.environment,
      browser: updatedDefect.browser,
      tags: updatedDefect.tags,
    };
    const response = await fetch(`/api/defects/${defect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      setDefect(await response.json());
      setIsEditModalOpen(false);
    }
  };

  const handleStatusChange = async (status: DefectStatus) => {
    const response = await fetch(`/api/defects/${defect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) setDefect(await response.json());
    setIsStatusDropdownOpen(false);
  };

  const handleAssign = async (assignee: string) => {
    const response = await fetch(`/api/defects/${defect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: assignee === "Unassigned" ? "" : assignee }),
    });
    if (response.ok) setDefect(await response.json());
    setIsAssignDropdownOpen(false);
  };

  const handleLinkTestCases = async (newLinks: string[]) => {
    if (newLinks.length > 0) {
      const response = await fetch(`/api/defects/${defect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linked_test_case: newLinks[0] }),
      });
      if (response.ok) setDefect(await response.json());
    }
    setLinkedTestCases([...linkedTestCases, ...newLinks]);
  };

  const metaItems = [
    { icon: Tag, label: "Priority", value: <Badge variant={priorityBadgeVariants[defect.priority]}>{defect.priority}</Badge> },
    { icon: Tag, label: "Severity", value: <Badge variant={severityBadgeVariants[defect.severity]}>{defect.severity}</Badge> },
    { icon: Tag, label: "Status", value: <Badge variant={getDefectStatusBadgeVariant(defect.status)}>{defect.status}</Badge> },
    { icon: Tag, label: "Type", value: defect.type },
    { icon: User, label: "Reporter", value: defect.reportedBy },
    { icon: User, label: "Assignee", value: defect.assignedTo || "Unassigned" },
    { icon: Globe, label: "Environment", value: defect.environment || "N/A" },
    { icon: Monitor, label: "Browser", value: defect.browser || "N/A" },
    { icon: Link2, label: "Linked Test Run", value: defect.linkedTestRun || "None" },
    { icon: Calendar, label: "Created", value: formatDate(defect.createdAt) },
    { icon: Calendar, label: "Updated", value: formatDate(defect.updatedAt) },
  ];

  if (defect.resolvedAt) {
    metaItems.push({ icon: Calendar, label: "Resolved", value: formatDate(defect.resolvedAt) });
  }

  const statusOptions: DefectStatus[] = ["Open", "In Progress", "Resolved", "Closed", "Blocked", "Reopened"];

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in relative z-0">
        <Link href="/defects" className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-primary-container transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Defects
        </Link>

        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="font-mono text-code text-primary-container">{defect.id}</span>
            <h1 className="text-headline-md font-headline font-semibold text-on-surface">{defect.title}</h1>
            <div className="flex gap-2">
              <Badge variant={severityBadgeVariants[defect.severity]}>{defect.severity}</Badge>
              <Badge variant={getDefectStatusBadgeVariant(defect.status)}>{defect.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              Edit Defect
            </Button>
            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                Change Status
              </Button>
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-elevated border border-outline-variant z-10 py-1 overflow-hidden">
                  {statusOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container-low transition-colors flex items-center justify-between"
                    >
                      {s}
                      {defect.status === s && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button variant="secondary" size="sm" onClick={() => setIsAssignDropdownOpen(!isAssignDropdownOpen)}>
                Assign
              </Button>
              {isAssignDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-outline-variant z-10 py-1 overflow-hidden">
                  <button
                    onClick={() => handleAssign("Unassigned")}
                    className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container-low transition-colors italic text-outline"
                  >
                    Unassigned
                  </button>
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleAssign(member.name)}
                      className="w-full text-left px-4 py-2 text-body-sm hover:bg-surface-container-low transition-colors flex items-center justify-between"
                    >
                      {member.name}
                      {defect.assignedTo === member.name && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={() => setIsLinkModalOpen(true)}>
              <Link2 className="h-3.5 w-3.5" /> Link Test Case
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            {defect.description && (
              <div className="bg-white border border-outline-variant rounded-xl p-6">
                <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Description</h3>
                <p className="text-body-md text-on-surface leading-relaxed">{defect.description}</p>
              </div>
            )}

            {defect.stepsToReproduce && (
              <div className="bg-white border border-outline-variant rounded-xl p-6">
                <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Steps to Reproduce</h3>
                <pre className="text-body-sm font-mono bg-surface-container-low/50 rounded-lg p-4 whitespace-pre-wrap text-on-surface">
                  {defect.stepsToReproduce}
                </pre>
              </div>
            )}

            <div className="bg-white border border-outline-variant rounded-xl p-6">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comments ({comments.length})
              </h3>

              <div className="space-y-4 mb-6">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">
                      {comment.initials}
                    </div>
                    <div className="flex-1 bg-surface-container-low rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-label-bold font-bold">{comment.author}</span>
                        <span className="text-[10px] text-outline" title={formatDate(comment.timestamp)}>{timeAgo(comment.timestamp)}</span>
                      </div>
                      <p className="text-body-sm text-on-surface whitespace-pre-wrap">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-fixed to-primary-fixed-dim border-2 border-white shadow-subtle flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-on-primary-fixed">
                  {sessionUser?.initials || "??"}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-sm bg-white focus:border-primary-container focus:ring-1 focus:ring-primary-fixed-dim focus:outline-none transition-all min-h-[80px] resize-y"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handlePostComment} disabled={!newComment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-4">
            <div className="bg-white border border-outline-variant rounded-xl p-5">
              <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-4">Details</h3>
              <div className="space-y-3">
                {metaItems.map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1 border-b border-outline-variant/30 last:border-0">
                    <span className="text-body-sm text-on-surface-variant flex items-center gap-1.5"><item.icon className="w-3.5 h-3.5" />{item.label}</span>
                    <span className="text-body-sm font-medium text-on-surface text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-outline-variant rounded-xl p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Linked Test Cases
                </h3>
                <button onClick={() => setIsLinkModalOpen(true)} className="p-1 hover:bg-surface-container-low rounded-full text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {linkedTestCases.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant italic">No test cases linked.</p>
              ) : (
                <div className="space-y-2">
                  {linkedTestCases.map(tcId => (
                    <Link key={tcId} href={`/test-cases/${tcId}`} className="flex items-center justify-between p-2 rounded bg-surface-container-low hover:bg-surface-container transition-colors group">
                      <span className="font-mono text-[11px] text-primary-container font-medium">{tcId}</span>
                      <ArrowLeft className="h-3 w-3 text-outline opacity-0 group-hover:opacity-100 transition-opacity rotate-180" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {defect.tags && defect.tags.length > 0 && (
              <div className="bg-white border border-outline-variant rounded-xl p-5">
                <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-3">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {defect.tags.map((tag) => (<Badge key={tag} variant="outline">{tag}</Badge>))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <LinkTestCaseModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        alreadyLinked={linkedTestCases}
        onLink={handleLinkTestCases}
        testCases={testCases}
      />

      <ReportDefectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditDefect}
        initialData={defect}
        testCases={testCases}
      />
    </>
  );
}
