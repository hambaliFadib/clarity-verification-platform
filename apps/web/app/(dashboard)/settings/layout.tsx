import type { ReactNode } from "react";

export default function DashboardSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="p-6 max-w-[1440px] mx-auto w-full">
      {children}
    </div>
  );
}
