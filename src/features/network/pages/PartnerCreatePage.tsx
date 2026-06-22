"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PartnerCreateForm } from "../components/PartnerCreateForm";

interface PartnerCreatePageProps {
  lockedFranchiseId?: string;
}

export function PartnerCreatePage({ lockedFranchiseId }: PartnerCreatePageProps) {
  const router = useRouter();
  const locked = Boolean(lockedFranchiseId);

  const backHref = locked
    ? `/admin/network/franchises/${lockedFranchiseId}?tab=partners`
    : "/admin/network/partners";

  const breadcrumb = locked
    ? ["Admin", "Réseau", "Franchises", "Nouveau partenaire"]
    : ["Admin", "Réseau", "Partenaires", "Nouveau"];

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader title="Nouveau partenaire" breadcrumb={breadcrumb} />
      <p className="mb-6 text-sm">
        <Link href={backHref} className="text-teal hover:underline">
          ← Retour
        </Link>
      </p>

      <p className="mb-6 max-w-3xl text-sm text-muted">
        Créez le compte partenaire et téléversez les documents légaux (pièce
        d&apos;identité recto/verso obligatoire). Les fichiers sont envoyés via
        URL signée puis rattachés au partenaire.
      </p>

      <PartnerCreateForm
        mode="admin"
        lockedFranchiseId={lockedFranchiseId}
        backHref={backHref}
        onSuccess={(partnerId) => {
          router.push(`/admin/network/partners/${partnerId}`);
        }}
      />
    </div>
  );
}
