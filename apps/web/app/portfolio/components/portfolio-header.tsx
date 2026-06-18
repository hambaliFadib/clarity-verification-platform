import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PortfolioHeader() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name || "Guest User";
  const userImage = session?.user?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuBEwJcO1Hrl7KaCfudlJ3bQEhDEmlXDLY3F3QmSDbCDBvKcrICaQt0-qBzjwXyo5czQWlDFCosxWVglmyZDVUUwK_lbdojB0ktAqduT_ZgQHjluXvGdt45rypPMPaMt8dkQ-lB6qqyZlsDdmztHnowB_9DDlSg9hMqe3KH8DFuUB1MiufHGjEQDwQYJxj8LJLSU9lMsHWm2Zg5kgYPt-7uHLDFsh67uKka1unM7MXA9Ixof3SJ-QML6VljI29KT2kmlw5bbux6FLKwh";

  return (
    <header className="bg-surface dark:bg-on-background flex justify-between items-center w-full px-margin-desktop h-16 sticky top-0 z-50 border-b border-outline-variant shadow-sm shadow-md dark:shadow-none">
      <div className="flex items-center gap-md">
        <span className="font-headline-md text-headline-md font-extrabold text-primary dark:text-inverse-primary tracking-tight">NexQA</span>
      </div>
      <div className="flex items-center gap-lg">
        <button className="text-primary dark:text-primary-fixed-dim hover:bg-surface-container-high dark:hover:bg-surface-variant transition-all duration-150 active:scale-95 p-2 rounded-full">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="flex items-center gap-sm">
          <img
            alt={userName}
            className="w-8 h-8 rounded-full border border-outline-variant"
            src={userImage}
          />
        </div>
      </div>
    </header>
  );
}
