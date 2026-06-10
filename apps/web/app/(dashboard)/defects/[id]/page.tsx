"use client";
import { use } from "react";
import Link from "next/link";
import { defects } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Globe, Monitor, Link2, Tag, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  getDefectStatusBadgeVariant,
  priorityBadgeVariants,
  severityBadgeVariants,
} from "@/lib/badge-variants";

export default function DefectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const defect = defects.find((d) => d.id === id);

  if (!defect) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-headline-md font-headline text-on-surface">Defect Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-2">The defect &quot;{id}&quot; does not exist.</p>
        <Link href="/defects" className="text-primary-container hover:underline mt-4 inline-block">Back to Defects</Link>
      </div>
    );
  }

  const metaItems = [
    { icon: Tag, label: "Priority", value: <Badge variant={priorityBadgeVariants[defect.priority]}>{defect.priority}</Badge> },
    { icon: Tag, label: "Severity", value: <Badge variant={severityBadgeVariants[defect.severity]}>{defect.severity}</Badge> },
    { icon: Tag, label: "Status", value: <Badge variant={getDefectStatusBadgeVariant(defect.status)}>{defect.status}</Badge> },
    { icon: Tag, label: "Type", value: defect.type },
    { icon: User, label: "Reporter", value: defect.reportedBy },
    { icon: User, label: "Assignee", value: defect.assignedTo || "Unassigned" },
    { icon: Globe, label: "Environment", value: defect.environment || "N/A" },
    { icon: Monitor, label: "Browser", value: defect.browser || "N/A" },
    { icon: Link2, label: "Linked Test Case", value: defect.linkedTestCase || "None" },
    { icon: Link2, label: "Linked Test Run", value: defect.linkedTestRun || "None" },
    { icon: Calendar, label: "Created", value: formatDate(defect.createdAt) },
    { icon: Calendar, label: "Updated", value: formatDate(defect.updatedAt) },
  ];
  if (defect.resolvedAt) {
    metaItems.push({ icon: Calendar, label: "Resolved", value: formatDate(defect.resolvedAt) });
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
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
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">Change Status</Button>
          <Button variant="secondary" size="sm">Assign</Button>
          <Button variant="outline" size="sm"><Link2 className="h-3.5 w-3.5" /> Link Test Case</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
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
              <pre className="text-body-sm font-mono bg-surface-container-low/50 rounded-lg p-4 whitespace-pre-wrap text-on-surface">{defect.stepsToReproduce}</pre>
            </div>
          )}
          <div className="bg-white border border-outline-variant rounded-xl p-6">
            <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Comments
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">SC</div>
                <div className="flex-1 bg-surface-container-low rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-bold font-bold">Sarah Chen</span>
                    <span className="text-[10px] text-outline">2 hours ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface">I can reproduce this consistently on Chrome 126. The API returns a 500 with no error body.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">DP</div>
                <div className="flex-1 bg-surface-container-low rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-bold font-bold">David Park</span>
                    <span className="text-[10px] text-outline">1 hour ago</span>
                  </div>
                  <p className="text-body-sm text-on-surface">Looking into this now. Seems like a missing validation middleware on the auth endpoint.</p>
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
                  <span className="text-body-sm text-on-surface-variant">{item.label}</span>
                  <span className="text-body-sm font-medium text-on-surface text-right">{item.value}</span>
                </div>
              ))}
            </div>
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
  );
}
