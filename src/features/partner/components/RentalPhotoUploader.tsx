"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sélecteur multi-photos pour les états des lieux (DB-RENT-13).
 * Composant contrôlé : expose les `File[]` sélectionnés. Le transfert binaire
 * réel (multipart + sanitation) est géré côté backend lors de l'intégration ;
 * ici on collecte les fichiers et leurs aperçus.
 */
export function RentalPhotoUploader({
  files,
  onChange,
  min = 1,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  min?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const add = (list: FileList | null) => {
    if (!list) return;
    onChange([...files, ...Array.from(list)]);
  };
  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {previews.map((url, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-red-600 text-xs text-white"
              aria-label="Retirer la photo"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-2xl text-muted hover:border-teal hover:text-teal"
        >
          +
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-muted">
        {files.length} photo{files.length > 1 ? "s" : ""} · minimum {min} requise
        {min > 1 ? "s" : ""}.
      </p>
    </div>
  );
}
