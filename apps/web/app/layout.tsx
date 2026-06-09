import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexQA - Clarity Platform",
  description: "Clarity Platform for QA Project Management"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
