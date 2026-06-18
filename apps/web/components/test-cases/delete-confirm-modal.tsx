"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from "@/components/ui/modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  testCaseId: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  testCaseId,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" preventClose={isDeleting}>
      <ModalHeader onClose={onClose} closeDisabled={isDeleting}>
        <div className="p-1.5 bg-error/10 text-error rounded-md">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <ModalTitle>Delete Test Case</ModalTitle>
      </ModalHeader>

      <ModalBody>
        <p className="text-body-md text-muted-foreground">
          Are you sure you want to delete test case{" "}
          <span className="font-semibold text-on-surface">{testCaseId}</span>?
          This action is permanent and cannot be undone.
        </p>
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          loading={isDeleting}
        >
          Delete Test Case
        </Button>
      </ModalFooter>
    </Modal>
  );
}
