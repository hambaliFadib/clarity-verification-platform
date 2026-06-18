"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Mail } from "lucide-react";
import type { TeamMember } from "@/lib/types";
import { roleBadgeVariants } from "@/lib/badge-variants";
import { PageHeader } from "@/components/layout/page-header";

const inputClass =
  "w-full border border-outline-variant rounded-md px-3 py-2.5 text-body-sm text-on-surface bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow";
const labelClass =
  "block text-label-sm font-bold text-on-surface-variant mb-1.5";

export default function ProjectMembersPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      const projectResponse = await fetch("/api/projects?limit=1", { cache: "no-store" });
      if (!isMounted) return;
      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        if (projectData[0]) {
          setActiveProjectId(projectData[0].id);
          const membersResponse = await fetch(`/api/projects/${projectData[0].id}/members`, { cache: "no-store" });
          if (membersResponse.ok) setTeamMembers(await membersResponse.json());
        }
      }
    }

    loadSettings().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleInvite = async () => {
    if (!activeProjectId || !inviteEmail.trim()) return;
    setIsInviting(true);
    setInviteMessage("");
    try {
      const response = await fetch(`/api/projects/${activeProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to invite member.");
      setTeamMembers((members) => {
        const next = members.filter((member) => member.id !== payload.id);
        return [...next, payload].sort((a, b) => a.name.localeCompare(b.name));
      });
      setInviteEmail("");
      setIsInviteOpen(false);
      setInviteMessage("Member added");
    } catch (error: any) {
      setInviteMessage(error.message || "Unable to invite member.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Project Members"
        subtitle="Manage who has access to this project."
        actions={
          <Button onClick={() => setIsInviteOpen(true)} disabled={!activeProjectId}>
            <Mail className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        }
      />

      <div className="bg-white border border-outline-variant rounded-xl p-8 space-y-6 shadow-sm">
        {isInviteOpen && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 space-y-4 animate-fade-in">
            <label className={labelClass}>Member Email</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                className={inputClass}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@company.com"
              />
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} className="sm:w-auto px-6">
                <Mail className="h-4 w-4 mr-2" /> {isInviting ? "Adding..." : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)} className="sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {inviteMessage && (
          <p className={inviteMessage === "Member added" ? "text-body-sm text-emerald-600 font-medium px-2" : "text-body-sm text-error font-medium px-2"}>
            {inviteMessage}
          </p>
        )}

        <div className="divide-y divide-outline-variant/50">
          {teamMembers.length === 0 ? (
            <div className="py-6 text-center text-body-md text-on-surface-variant bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant mt-4">
              No team members configured yet.
            </div>
          ) : teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-sm">
                  {member.initials}
                </div>
                <div>
                  <p className="text-title-md font-semibold text-on-surface">
                    {member.name}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {member.email}
                  </p>
                </div>
              </div>
              <Badge variant={roleBadgeVariants[member.role]}>
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
