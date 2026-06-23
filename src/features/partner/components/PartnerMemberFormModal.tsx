"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { ModalPortal } from "@/shared/ui/ModalPortal";
import {
  useCreatePartnerMember,
  useUpdatePartnerMember,
} from "../api/members.queries";
import type { PartnerMember } from "../api/members.service";

interface PartnerMemberFormModalProps {
  open: boolean;
  member?: PartnerMember | null;
  onClose: () => void;
}

const ROLE_OPTIONS: { value: PartnerMember["role"]; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "operator", label: "Opérateur" },
  { value: "viewer", label: "Lecteur" },
];

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-teal/30 focus:ring-2";

export function PartnerMemberFormModal({
  open,
  member,
  onClose,
}: PartnerMemberFormModalProps) {
  const isEdit = Boolean(member);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<PartnerMember["role"]>("operator");
  const [status, setStatus] = useState<PartnerMember["status"]>("active");

  const create = useCreatePartnerMember();
  const update = useUpdatePartnerMember(member?.id ?? "");

  useEffect(() => {
    if (open) {
      setFirstName(member?.first_name ?? "");
      setLastName(member?.last_name ?? "");
      setEmail(member?.email ?? "");
      setPhone(member?.phone ?? "");
      setRole(member?.role ?? "operator");
      setStatus(member?.status ?? "active");
    }
  }, [open, member]);

  if (!open) return null;

  const pending = create.isPending || update.isPending;
  const valid = isEdit
    ? true
    : firstName.trim() && lastName.trim() && /\S+@\S+\.\S+/.test(email);

  const handleSubmit = () => {
    if (!valid || pending) return;
    if (isEdit) {
      update.mutate({ role, status }, { onSuccess: onClose });
    } else {
      create.mutate(
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
        },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-overlay animate-fade-up"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-card bg-surface p-6 shadow-card animate-fade-up"
      >
        <h2 className="text-lg font-semibold text-heading">
          {isEdit ? "Modifier le membre" : "Ajouter un membre"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEdit
            ? "Mettez à jour le rôle et le statut de ce membre."
            : "Invitez un nouveau membre à votre équipe."}
        </p>

        <div className="mt-4 space-y-3">
          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium">Prénom</span>
                  <input
                    className={inputClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Kouassi"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Nom</span>
                  <input
                    className={inputClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Yao"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium">Email</span>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="membre@exemple.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Téléphone (optionnel)</span>
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225 01 02 03 04 05"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="text-sm font-medium">Rôle</span>
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as PartnerMember["role"])}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {isEdit && (
            <label className="block">
              <span className="text-sm font-medium">Statut</span>
              <select
                className={inputClass}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as PartnerMember["status"])
                }
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button disabled={!valid || pending} onClick={handleSubmit}>
            {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
