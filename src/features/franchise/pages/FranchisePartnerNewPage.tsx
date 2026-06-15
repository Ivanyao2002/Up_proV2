"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { useCreateFranchisePartner } from "../api/partners.queries";
import type { CreatePartnerPayload } from "../api/partners.service";

const EMPTY_FORM: CreatePartnerPayload = {
  name: "",
  trade_name: "",
  legal_name: "",
  contact_email: "",
  contact_phone: "",
  city: "",
  address: "",
};

interface FilePreview {
  file: File;
  url: string;
}

function FileUploadField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: FilePreview | null;
  onChange: (v: FilePreview | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (value?.url) URL.revokeObjectURL(value.url);
    onChange({ file, url: URL.createObjectURL(file) });
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {hint && <p className="mb-1.5 text-xs text-muted/70">{hint}</p>}
      <div
        className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-canvas transition-colors hover:border-teal/50 hover:bg-teal/5"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        {value ? (
          <>
            <img
              src={value.url}
              alt={label}
              className="max-h-28 max-w-full rounded object-contain"
            />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100"
              onClick={(e) => {
                e.stopPropagation();
                if (value.url) URL.revokeObjectURL(value.url);
                onChange(null);
              }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <svg className="h-8 w-8 text-muted/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-xs text-muted">Cliquez ou glissez une image ici</span>
            <span className="text-xs text-muted/60">JPG, PNG — max 5 Mo</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function FranchisePartnerNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreatePartnerPayload>(EMPTY_FORM);
  const [idFront, setIdFront] = useState<FilePreview | null>(null);
  const [idBack, setIdBack] = useState<FilePreview | null>(null);
  const [rcc, setRcc] = useState<FilePreview | null>(null);
  const createPartner = useCreateFranchisePartner();

  const field = (key: keyof CreatePartnerPayload) => ({
    value: (form[key] ?? "") as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPartner.mutate(form, {
      onSuccess: (partner) => {
        router.push(`/franchise/partners/${partner.id}`);
      },
    });
  };

  return (
    <div className="animate-fade-up">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Nouveau partenaire"
          breadcrumb={["Franchise", "Partenaires", "Nouveau"]}
        />
        <Link href="/franchise/partners" className="mt-1 inline-flex items-center gap-1 text-sm text-teal hover:underline">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
        <div className="rounded-card border border-border bg-surface p-6 shadow-card">

          {/* Infos générales */}
          <h2 className="mb-4 text-sm font-semibold text-foreground">Informations générales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Nom commercial *</label>
              <input
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Ex : Transport Express"
                {...field("name")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Raison sociale</label>
              <input
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Dénomination légale"
                {...field("legal_name")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email *</label>
              <input
                required
                type="email"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="contact@partenaire.com"
                {...field("contact_email")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Téléphone *</label>
              <input
                required
                type="tel"
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="07 12 34 56 78"
                {...field("contact_phone")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Ville *</label>
              <input
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Ex : Abidjan"
                {...field("city")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Adresse</label>
              <input
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40"
                placeholder="Rue, quartier…"
                {...field("address")}
              />
            </div>
          </div>

          <hr className="my-6 border-border" />

          {/* Pièce d'identité */}
          <h2 className="mb-1 text-sm font-semibold text-foreground">Pièce d'identité *</h2>
          <p className="mb-4 text-xs text-muted">CNI, passeport ou tout document officiel.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileUploadField
              label="Recto *"
              hint="Face avant de la pièce"
              value={idFront}
              onChange={setIdFront}
            />
            <FileUploadField
              label="Verso *"
              hint="Face arrière de la pièce"
              value={idBack}
              onChange={setIdBack}
            />
          </div>

          <hr className="my-6 border-border" />

          {/* RCC */}
          <h2 className="mb-1 text-sm font-semibold text-foreground">
            Registre de Commerce (RCC)
            <span className="ml-2 text-xs font-normal text-muted">— optionnel</span>
          </h2>
          <p className="mb-4 text-xs text-muted">Extrait du registre de commerce si applicable.</p>
          <FileUploadField
            label="Document RCC"
            value={rcc}
            onChange={setRcc}
          />

          <hr className="my-6 border-border" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/franchise/partners">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
            <Button
              type="submit"
              disabled={createPartner.isPending || !idFront || !idBack}
            >
              {createPartner.isPending ? "Création…" : "Créer le partenaire"}
            </Button>
          </div>

          {(!idFront || !idBack) && (
            <p className="mt-2 text-right text-xs text-amber-600">
              La pièce d'identité recto et verso est obligatoire.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
