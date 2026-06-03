"use client";

import { useState } from "react";
import { DocumentLightbox } from "./DocumentLightbox";

interface DocumentPreviewThumbnailProps {
  src: string;
  alt: string;
  isPdf?: boolean;
  subtitle?: string;
  className?: string;
}

export function DocumentPreviewThumbnail({
  src,
  alt,
  isPdf = false,
  subtitle,
  className = "",
}: DocumentPreviewThumbnailProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative w-full overflow-hidden rounded-lg border border-border bg-canvas transition-all hover:border-teal/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal/40 ${className}`}
        aria-label={`Agrandir : ${alt}`}
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
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="h-28 w-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.02] md:h-32"
          />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/70 to-transparent px-3 py-2 text-left text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          Cliquer pour agrandir
        </span>
      </button>

      <DocumentLightbox
        open={open}
        onClose={() => setOpen(false)}
        title={alt}
        src={src}
        isPdf={isPdf}
        subtitle={subtitle}
      />
    </>
  );
}
