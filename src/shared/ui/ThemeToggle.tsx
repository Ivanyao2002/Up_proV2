"use client";

import { useThemeStore } from "@/core/theme/themeStore";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.classList.add("theme-transition");
        toggleTheme();
        window.setTimeout(() => {
          document.documentElement.classList.remove("theme-transition");
        }, 300);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-canvas text-muted transition-colors hover:bg-surface-hover hover:text-foreground ${className}`}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode nuit"}
      title={isDark ? "Mode clair" : "Mode nuit"}
    >
      {isDark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="h-[18px] w-[18px] text-teal"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          className="h-[18px] w-[18px]"
          aria-hidden
        >
          <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
        </svg>
      )}
    </button>
  );
}
