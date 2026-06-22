"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { Button } from "@/shared/ui/Button";
import { useAssignDispute } from "../api/dispute.queries";
import type { Dispute } from "../api/dispute.types";

export function DisputeAssignmentCell({ dispute }: { dispute: Dispute }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const assign = useAssignDispute(dispute.id);
  const router = useRouter();

  const assignedToMe =
    dispute.assigned_to_id != null &&
    String(dispute.assigned_to_id) === String(currentUserId);

  if (dispute.assigned_to) {
    return (
      <div>
        <p className="text-sm font-medium text-foreground">
          {assignedToMe ? "Vous" : dispute.assigned_to}
        </p>
        <p className="text-xs text-muted">
          {assignedToMe ? "Pris en charge" : "Déjà assigné"}
        </p>
      </div>
    );
  }

  return (
    <Button
      className="!px-3 !py-2 !text-xs"
      disabled={assign.isPending}
      onClick={() =>
        assign.mutate(undefined, {
          onSuccess: () => router.push(`/support/disputes/${dispute.id}`),
        })
      }
    >
      {assign.isPending ? "Assignation…" : "S'assigner"}
    </Button>
  );
}
