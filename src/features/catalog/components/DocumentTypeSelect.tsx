"use client";

import { useDocumentTypes } from "../api/documentTypes.queries";

interface DocumentTypeSelectProps {
  category?: "driver" | "vehicle" | "partner";
  value?: string;
  onChange: (value: string, documentType?: { id: string; code: string; label: string }) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function DocumentTypeSelect({
  category,
  value,
  onChange,
  placeholder = "Sélectionner un type de document",
  className = "",
  required = false,
}: DocumentTypeSelectProps) {
  const { data: documentTypes, isLoading, isError } = useDocumentTypes(category);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedType = documentTypes?.find((t) => t.id === selectedId);
    onChange(selectedId, selectedType);
  };

  if (isLoading) {
    return (
      <select
        disabled
        className={`w-full rounded-lg border border-border bg-muted px-3 py-2 ${className}`}
      >
        <option>Chargement...</option>
      </select>
    );
  }

  if (isError) {
    return (
      <select
        disabled
        className={`w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 ${className}`}
      >
        <option>Erreur de chargement</option>
      </select>
    );
  }

  return (
    <select
      value={value || ""}
      onChange={handleChange}
      required={required}
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 focus:border-teal focus:outline-none ${className}`}
    >
      <option value="">{placeholder}</option>
      {documentTypes?.map((type) => (
        <option key={type.id} value={type.id}>
          {type.label} {type.required && "*"}
        </option>
      ))}
    </select>
  );
}
