"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function GlobalShortcuts() {
  useKeyboardShortcuts();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <GlobalShortcuts />
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </SessionProvider>
  );
}
