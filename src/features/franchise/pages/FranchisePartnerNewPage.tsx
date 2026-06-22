"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PartnerCreateForm } from "@/features/network/components/PartnerCreateForm";

export function FranchisePartnerNewPage() {
  const router = useRouter();

  return (
    <div className="animate-fade-up">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title="Nouveau partenaire"
          breadcrumb={["Franchise", "Partenaires", "Nouveau"]}
        />
        <Link
          href="/franchise/partners"
          className="mt-1 inline-flex items-center gap-1 text-sm text-teal hover:underline"
        >
          ← Retour
        </Link>
      </div>

      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-sm text-muted">
          Créez un partenaire rattaché à votre franchise. Les documents d&apos;identité
          (recto et verso) sont obligatoires et envoyés via le flux d&apos;upload sécurisé
          de la plateforme.
        </p>

        <PartnerCreateForm
          mode="franchise"
          backHref="/franchise/partners"
          onSuccess={(partnerId) => {
            router.push(`/franchise/partners/${partnerId}`);
          }}
        />
      </div>
    </div>
  );
}
