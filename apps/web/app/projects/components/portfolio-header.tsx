import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NotificationPopover } from "@/components/layout/notification-popover";

export async function PortfolioHeader() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "Guest User";
  const userImage = session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBEwJcO1Hrl7KaCfudlJ3bQEhDEmlXDLY3F3QmSDbCDBvKcrICaQt0-qBzjwXyo5czQWlDFCosxWVglmyZDVUUwK_lbdojB0ktAqduT_ZgQHjluXvGdt45rypPMPaMt8dkQ-lB6qqyZlsDdmztHnowB_9DDlSg9hMqe3KH8DFuUB1MiufHGjEQDwQYJxj8LJLSU9lMsHWm2Zg5kgYPt-7uHLDFsh67uKka1unM7MXA9Ixof3SJ-QML6VljI29KT2kmlw5bbux6FLKwh";
  const userRole = (session?.user as any)?.role || "Viewer";

  return (
    <header className="flex justify-between items-center w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant h-16 px-margin-mobile md:px-margin-desktop shadow-subtle transition-all duration-300">
      <div className="flex items-center gap-2">
        <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">NexQA</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationPopover />
        <Link href="/account" className="flex items-center gap-3 pl-3 ml-1 border-l border-outline-variant hover:opacity-80 transition-opacity">
          <div className="text-right hidden sm:block">
            <p className="text-label-bold font-label-bold text-on-surface leading-tight">
              {userName}
            </p>
            <span className="text-[9px] bg-gradient-to-r from-primary-container to-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-normal">
              {userRole}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs border-2 border-surface shadow-sm">
            {userName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}
