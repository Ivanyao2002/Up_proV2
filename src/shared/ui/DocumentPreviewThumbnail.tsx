"use client";

import { useEffect, useState } from "react";
import { DocumentLightbox } from "./DocumentLightbox";

interface DocumentPreviewThumbnailProps {
  src: string;
  alt: string;
  isPdf?: boolean;
  fallbackSrc?: string;
  subtitle?: string;
  className?: string;
  /** Si false, le clic ouvre le sélecteur au lieu de la lightbox. */
  allowPreview?: boolean;
  /** Déclenché quand il n'y a pas d'image affichable (vide, erreur, ou preview désactivée). */
  onPickFile?: () => void;
  pickLabel?: string;
  /** Hauteur de l'aperçu image (classes Tailwind). Agrandissable pour les pièces
   * d'identité recto/verso (#75 audit UX). */
  imageHeightClassName?: string;
}

function PickFilePlaceholder({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-[5rem] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-canvas p-4 text-center ${className ?? ""}`}
    >
      <svg
        className="h-8 w-8 text-muted/50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

export function DocumentPreviewThumbnail({
  src,
  alt,
  isPdf = false,
  fallbackSrc,
  subtitle,
  className = "",
  allowPreview = true,
  onPickFile,
  pickLabel = "Cliquer pour choisir une image",
  imageHeightClassName = "h-28 md:h-32",
}: DocumentPreviewThumbnailProps) {
  const [open, setOpen] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src);
    setLoadFailed(false);
  }, [src]);

  const canOpenLightbox =
    allowPreview && !loadFailed && Boolean(activeSrc?.trim()) && !isPdf;
  const shouldPickOnClick =
    Boolean(onPickFile) && (!allowPreview || loadFailed || !activeSrc?.trim());
  const showPickPlaceholder =
    shouldPickOnClick || (loadFailed && !canOpenLightbox);

  const handleClick = () => {
    if (shouldPickOnClick) {
      onPickFile?.();
      return;
    }
    if (canOpenLightbox) {
      setOpen(true);
    }
  };

  const placeholderLabel = loadFailed && !onPickFile
    ? "Image indisponible"
    : pickLabel;

  const ariaLabel = shouldPickOnClick
    ? `Choisir un fichier : ${alt}`
    : loadFailed
      ? alt
      : `Agrandir : ${alt}`;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`group relative w-full overflow-hidden rounded-lg border border-border bg-canvas transition-all hover:border-teal/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal/40 ${className}`}
        aria-label={ariaLabel}
      >
        {isPdf ? (
          <div className="flex min-h-[7rem] flex-col items-center justify-center gap-2 p-4">
            <svg
              className="h-10 w-10 text-red-500/70"
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
            <span className="text-xs text-muted">PDF · Cliquer pour ouvrir</span>
          </div>
        ) : showPickPlaceholder ? (
          <PickFilePlaceholder label={placeholderLabel} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeSrc}
            alt={alt}
            referrerPolicy="no-referrer"
            className={`${imageHeightClassName} w-full bg-navy/5 object-contain object-center transition-transform duration-200 group-hover:scale-[1.02]`}
            onError={(e) => {
              const img = e.currentTarget;
              if (
                fallbackSrc &&
                img.dataset.fallbackApplied !== "1" &&
                activeSrc !== fallbackSrc
              ) {
                img.dataset.fallbackApplied = "1";
                setActiveSrc(fallbackSrc);
                return;
              }
              setLoadFailed(true);
            }}
          />
        )}
        {!showPickPlaceholder && canOpenLightbox && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/70 to-transparent px-3 py-2 text-left text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            Cliquer pour agrandir
          </span>
        )}
      </button>

      {canOpenLightbox && (
        <DocumentLightbox
          open={open}
          onClose={() => setOpen(false)}
          title={alt}
          src={activeSrc}
          isPdf={isPdf}
          subtitle={subtitle}
        />
      )}
    </>
  );
}
