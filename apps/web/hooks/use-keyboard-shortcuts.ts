"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const clickButtonByText = (labels: string[]) => {
      const button = Array.from(document.querySelectorAll("button")).find((item) =>
        labels.some((label) => item.textContent?.toLowerCase().includes(label.toLowerCase())),
      );
      if (!button) return false;
      button.click();
      return true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "SELECT" ||
        activeElement?.isContentEditable
      ) {
        // Allow Ctrl+S for saving inside forms
        if ((event.ctrlKey || event.metaKey) && event.key === "s") {
          const form = activeElement.closest("form");
          const saveButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
          if (saveButton) {
            event.preventDefault();
            saveButton.click();
            return;
          }
        }
        return;
      }

      // Ctrl/Cmd + N: New Item (Requirement / Test Run)
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault();
        if (window.location.pathname.includes("/test-runs")) {
          if (!clickButtonByText(["New Test Run", "New Run"])) {
            toast.info("New Test Run is not available yet.");
          }
        } else if (window.location.pathname.includes("/requirements")) {
          if (!clickButtonByText(["New Requirement"])) {
            toast.info("New Requirement is not available on this view.");
          }
        } else {
          router.push("/requirements");
        }
      }

      // ?: Show Help
      if (event.key === "?") {
        event.preventDefault();
        toast("Keyboard Shortcuts", {
          description: "Ctrl+N: New Item\nCtrl+S: Save Form\nEsc: Close Modals",
          duration: 5000,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
