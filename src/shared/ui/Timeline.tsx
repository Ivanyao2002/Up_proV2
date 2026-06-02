import { formatDateTime } from "@/shared/lib/format";

export interface TimelineItem {
  id: string;
  label: string;
  description?: string;
  at: string;
  variant?: "default" | "success" | "warning" | "muted";
}

const DOT: Record<NonNullable<TimelineItem["variant"]>, string> = {
  default: "bg-navy",
  success: "bg-teal",
  warning: "bg-amber-400",
  muted: "bg-muted/50",
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
          {i < items.length - 1 && (
            <span
              className="absolute left-[7px] top-4 h-full w-px bg-border"
              aria-hidden
            />
          )}
          <span
            className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white shadow-sm ${DOT[item.variant ?? "default"]}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#212529]">{item.label}</p>
            {item.description && (
              <p className="mt-0.5 text-sm text-muted">{item.description}</p>
            )}
            <time className="mt-1 block text-xs text-muted">
              {formatDateTime(item.at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
