"use client";

import { useEffect, useState } from "react";
import { Button } from "./Button";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2] as const;

interface DocumentLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string;
  isPdf?: boolean;
  subtitle?: string;
}

export function DocumentLightbox({
  open,
  onClose,
  title,
  src,
  isPdf = false,
  subtitle,
}: DocumentLightboxProps) {
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setZoomIndex(0);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const scale = ZOOM_LEVELS[zoomIndex];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-navy/90 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white md:px-6">
        <div className="min-w-0">
          <p className="truncate font-medium">{title}</p>
          {subtitle && <p className="truncate text-xs text-white/70">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPdf && (
            <>
              <button
                type="button"
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                className="rounded-lg px-2.5 py-1.5 text-sm text-white/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Zoom arrière"
              >
                −
              </button>
              <span className="min-w-[3rem] text-center text-xs tabular-nums text-white/80">
                {Math.round(scale * 100)} %
              </span>
              <button
                type="button"
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                onClick={() =>
                  setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))
                }
                className="rounded-lg px-2.5 py-1.5 text-sm text-white/90 hover:bg-white/10 disabled:opacity-40"
                aria-label="Zoom avant"
              >
                +
              </button>
            </>
          )}
          <Button
            type="button"
            variant="secondary"
            className="!py-1.5 !text-xs"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>

      <button
        type="button"
        className="flex flex-1 items-center justify-center overflow-auto p-4 md:p-8"
        aria-label="Fermer l'aperçu"
        onClick={onClose}
      >
        <div
          className="max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          {isPdf ? (
            <div className="flex max-w-lg flex-col items-center gap-4 rounded-card bg-surface p-8 text-center shadow-card">
              <svg
                className="h-16 w-16 text-red-500/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-muted">Document PDF</p>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-teal hover:underline"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={title}
              className="max-h-[calc(100vh-8rem)] rounded-lg shadow-2xl transition-transform duration-200"
              style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
              draggable={false}
            />
          )}
        </div>
      </button>
    </div>
  );
}
