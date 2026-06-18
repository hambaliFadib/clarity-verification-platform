import { Metadata } from "next";
import { CreateReportClient } from "./create-report-client";

export const metadata: Metadata = {
  title: "Generate New Report - NexQA",
  description: "Generate a new enterprise report",
};

export default function CreateReportPage() {
  return <CreateReportClient />;
}
