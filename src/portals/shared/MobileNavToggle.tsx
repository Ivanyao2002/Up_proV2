interface MobileNavToggleProps {
  onClick: () => void;
  open?: boolean;
}

export function MobileNavToggle({ onClick, open = false }: MobileNavToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
      aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      aria-expanded={open}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        {open ? (
          <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
        ) : (
          <>
            <path strokeLinecap="round" d="M4 7h16" />
            <path strokeLinecap="round" d="M4 12h16" />
            <path strokeLinecap="round" d="M4 17h16" />
          </>
        )}
      </svg>
    </button>
  );
}
