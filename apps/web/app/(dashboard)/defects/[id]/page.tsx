"use client";
import { use, useState } from "react";
import Link from "next/link";
import { defects, teamMembers } from "@/lib/mock-data";
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
import type { Defect, DefectStatus } from "@/lib/types";

interface Comment {
  id: string;
  author: string;
  initials: string;
  timestamp: string;
  text: string;
}

const mockComments: Comment[] = [
  { id: "c1", author: "Sarah Chen", initials: "SC", timestamp: new Date(Date.now() - 7200000).toISOString(), text: "I can reproduce this consistently on Chrome 126. The API returns a 500 with no error body." },
  { id: "c2", author: "David Park", initials: "DP", timestamp: new Date(Date.now() - 3600000).toISOString(), text: "Looking into this now. Seems like a missing validation middleware on the auth endpoint." }
];

export default function DefectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const initialDefect = defects.find((d) => d.id === id);

  const [defect, setDefect] = useState<Defect | undefined>(initialDefect);

  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const [linkedTestCases, setLinkedTestCases] = useState<string[]>(
    initialDefect?.linkedTestCase ? [initialDefect.linkedTestCase] : []
  );

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);

  if (!defect) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Defect Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">The defect &quot;{id}&quot; does not exist.</p>
        <Link href="/defects" className="text-primary-container hover:underline mt-4 inline-block">Back to Defects</Link>
      </div>
    );
  }

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: "Hambali Fadib",
      initials: "HF",
      timestamp: new Date().toISOString(),
      text: newComment.trim()
    };
    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleStatusChange = (status: DefectStatus) => {
    setDefect({ ...defect, status });
    setIsStatusDropdownOpen(false);
  };

  const handleAssign = (assignee: string) => {
    setDefect({ ...defect, assignedTo: assignee });
    setIsAssignDropdownOpen(false);
  };

  const handleLinkTestCases = (newLinks: string[]) => {
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
                  HF
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
      />
    </>
  );
}
