import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderGit2, Boxes, TestTube2 } from "lucide-react";

export function TestCasesTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Modules",
      href: "/test-cases/modules",
      icon: FolderGit2,
      isActive: pathname === "/test-cases/modules",
    },
    {
      name: "Scenarios",
      href: "/test-cases/scenarios",
      icon: Boxes,
      isActive: pathname === "/test-cases/scenarios",
    },
    {
      name: "Test Cases",
      href: "/test-cases",
      icon: TestTube2,
      isActive: pathname === "/test-cases" || pathname.startsWith("/test-cases/") && !pathname.includes("/modules") && !pathname.includes("/scenarios"),
    },
  ];

  return (
    <div className="border-b border-outline-variant mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cn(
              tab.isActive
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface",
              "group inline-flex items-center border-b-2 py-4 px-1 text-body-md font-medium"
            )}
            aria-current={tab.isActive ? "page" : undefined}
          >
            <tab.icon
              className={cn(
                tab.isActive ? "text-primary" : "text-outline group-hover:text-on-surface",
                "-ml-0.5 mr-2 h-5 w-5"
              )}
              aria-hidden="true"
            />
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
