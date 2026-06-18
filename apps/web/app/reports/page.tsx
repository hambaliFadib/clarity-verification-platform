import { Metadata } from "next";
import { PortfolioHeader } from "../projects/components/portfolio-header";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Reports Management - NexQA",
  description: "Enterprise Reports Management",
};

export default function ReportsPage() {
  return (
    <div className="text-on-background h-screen flex flex-col items-center overflow-hidden bg-surface">
      <PortfolioHeader />

      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        <ReportsClient />
      </div>
    </div>
  );
}
