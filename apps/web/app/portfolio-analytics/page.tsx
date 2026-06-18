import { Metadata } from "next";
import { PortfolioHeader } from "../projects/components/portfolio-header";
import { PortfolioAnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Portfolio Analytics - NexQA",
  description: "Enterprise portfolio analytics and reporting",
};

export default function PortfolioAnalyticsPage() {
  return (
    <div className="text-on-background h-screen flex flex-col items-center overflow-hidden bg-surface">
      <PortfolioHeader />
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        <PortfolioAnalyticsClient />
      </div>
    </div>
  );
}
