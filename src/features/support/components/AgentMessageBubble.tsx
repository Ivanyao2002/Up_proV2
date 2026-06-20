import { formatDateTime } from "@/shared/lib/format";
import type { TicketMessage } from "../api/support.api.contract";

interface Props {
  message: TicketMessage;
}

const NOTE_STYLE   = "bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40";
const JUSTIF_STYLE = "bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/40";
const AGENT_STYLE  = "bg-teal/10 border border-teal/20";
const USER_STYLE   = "bg-surface border border-border";

function SystemMessage({ message }: Props) {
  return (
    <div className="py-2 text-center">
      <span className="rounded-full bg-canvas px-3 py-1 text-xs text-muted">
        {message.content}
      </span>
    </div>
  );
}

export function AgentMessageBubble({ message }: Props) {
  if (message.type === "system") return <SystemMessage message={message} />;

  const isAgent  = message.sender === "agent";
  const isNote   = message.type === "internal_note";
  const isJustif = message.type === "justification_request";

  const bubbleCls = isNote ? NOTE_STYLE : isJustif ? JUSTIF_STYLE : isAgent ? AGENT_STYLE : USER_STYLE;

  const typeLabel = isNote
    ? "Note interne"
    : isJustif
      ? "Justificatifs demandés"
      : null;

  const nameCls = isNote
    ? "text-amber-700 dark:text-amber-300"
    : isJustif
      ? "text-indigo-700 dark:text-indigo-300"
      : isAgent
        ? "text-teal-dark"
        : "text-muted";

  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${bubbleCls}`}>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {typeLabel && (
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${nameCls}`}>
              {typeLabel} ·
            </span>
          )}
          <span className={`text-xs font-medium ${nameCls}`}>{message.sender_name}</span>
          <span className="text-[10px] text-muted">{formatDateTime(message.created_at)}</span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{message.content}</p>
      </div>
    </div>
  );
}
