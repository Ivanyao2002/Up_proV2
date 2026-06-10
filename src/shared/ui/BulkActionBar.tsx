"use client";

import { Button } from "./Button";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
  }[];
}

export function BulkActionBar({ count, onClear, actions = [] }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky bottom-6 z-20 mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-card border border-teal/20 bg-teal/10 px-5 py-3 shadow-card backdrop-blur-sm animate-fade-up">
      <span className="text-sm font-medium text-foreground">
        {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? "secondary"}
            className="!py-1.5 !text-xs"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
        <Button variant="ghost" className="!py-1.5 !text-xs" onClick={onClear}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
