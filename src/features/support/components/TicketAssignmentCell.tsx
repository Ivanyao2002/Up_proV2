"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/authStore";
import { Button } from "@/shared/ui/Button";
import { useAssignTicket } from "../api/agentTicket.queries";
import { useSupportPaths } from "../lib/supportPaths";
import type { AdminSupportTicket } from "../api/tickets.service";

export function TicketAssignmentCell({ ticket }: { ticket: AdminSupportTicket }) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const assign  = useAssignTicket(ticket.id);
  const paths   = useSupportPaths();
  const router  = useRouter();

  const assignedToMe =
    ticket.assigned_to_id != null &&
    String(ticket.assigned_to_id) === String(currentUserId);

  if (ticket.assigned_to) {
    return (
      <div>
        <p className="text-sm font-medium text-foreground">
          {assignedToMe ? "Vous" : ticket.assigned_to}
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
          onSuccess: () => router.push(paths.ticketDetail(ticket.id)),
        })
      }
    >
      {assign.isPending ? "Assignation…" : "S'assigner"}
    </Button>
  );
}
