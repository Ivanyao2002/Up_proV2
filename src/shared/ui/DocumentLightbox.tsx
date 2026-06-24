"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isRemoteKycPreviewUrl } from "@/shared/lib/documentPreview";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

const ZOOM_LEVELS = [1, 1.25, 1.5, 2] as const;

interface DocumentLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  src: string;
  isPdf?: boolean;
  subtitle?: string;
}

function viewportFitLimits() {
  if (typeof window === "undefined") {
    return { maxW: 672, maxH: 600 };
  }
  return {
    maxW: Math.min(window.innerWidth * 0.92, 672),
    maxH: Math.min(window.innerHeight * 0.78, window.innerHeight - 112),
  };
}

function fitImageSize(
  naturalWidth: number,
  naturalHeight: number,
  scale: number
): { width: number; height: number } {
  const { maxW, maxH } = viewportFitLimits();
  const fit = Math.min(maxW / naturalWidth, maxH / naturalHeight, 1);
  return {
    width: naturalWidth * fit * scale,
    height: naturalHeight * fit * scale,
  };
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
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useFocusTrap<HTMLDivElement>(open && mounted, onClose);

  const zoomIn = useCallback(
    () => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1)),
    []
  );
  const zoomOut = useCallback(
    () => setZoomIndex((i) => Math.max(0, i - 1)),
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setZoomIndex(0);
      setNaturalSize(null);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (isPdf) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, isPdf, zoomIn, zoomOut]);

  useEffect(() => {
    setNaturalSize(null);
  }, [src]);

  if (!open || !mounted) return null;

  const scale = ZOOM_LEVELS[zoomIndex];
  const displaySize =
    naturalSize && !isPdf
      ? fitImageSize(naturalSize.width, naturalSize.height, scale)
      : null;

  const toolbarBtn =
    "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-base font-semibold text-white shadow-sm transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40";

  const content = (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-black/85 outline-none backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/20 bg-zinc-950/90 px-4 py-3 text-white md:px-6">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-zinc-300">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isPdf && (
            <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-black/30 px-1 py-0.5">
              <button
                type="button"
                disabled={zoomIndex === 0}
                onClick={zoomOut}
                className={toolbarBtn}
                aria-label="Zoom arrière"
              >
                −
              </button>
              <span className="min-w-[3.25rem] px-1 text-center text-sm font-medium tabular-nums text-white">
                {Math.round(scale * 100)} %
              </span>
              <button
                type="button"
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                onClick={zoomIn}
                className={toolbarBtn}
                aria-label="Zoom avant"
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain touch-pan-y"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="inline-flex min-w-full justify-center p-4 sm:p-8">
          <div
            className="inline-block max-w-none"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {isPdf ? (
              <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 rounded-card bg-surface p-8 text-center shadow-card">
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
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="block max-w-none rounded-lg bg-zinc-900/40 shadow-2xl"
                  style={
                    displaySize
                      ? {
                          width: displaySize.width,
                          height: displaySize.height,
                        }
                      : {
                          maxHeight: viewportFitLimits().maxH,
                          maxWidth: viewportFitLimits().maxW,
                          width: "auto",
                          height: "auto",
                        }
                  }
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                      setNaturalSize({
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                    }
                  }}
                />
                {isRemoteKycPreviewUrl(src) && (
                  <a
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/25"
                  >
                    Ouvrir le fichier dans un nouvel onglet
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
