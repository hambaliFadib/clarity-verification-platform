"use client";

import { useSession, signOut } from "next-auth/react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import Image from "next/image";

export default function AccountPage() {
  const { data: session } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Account Settings" subtitle="Manage your personal profile and preferences" />

      <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-6">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full shadow-subtle"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-display-sm text-primary">
              <UserIcon className="h-10 w-10" />
            </div>
          )}
          
          <div>
            <h2 className="text-headline-md font-bold text-on-surface">{session?.user?.name || "Guest User"}</h2>
            <p className="text-body-lg text-on-surface-variant">{session?.user?.email || "guest@clarity.local"}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-primary-container text-on-primary-container text-label-sm font-bold uppercase rounded-full tracking-normal">
              {(session?.user as any)?.role || "Viewer"}
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-6">
          <h3 className="text-label-bold font-label-bold text-outline uppercase tracking-normal mb-4">Account Actions</h3>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
