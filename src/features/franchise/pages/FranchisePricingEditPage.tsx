"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { ServicePill } from "@/shared/ui/ServicePill";
import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import {
  PricingForm,
  type PricingFormValues,
} from "@/features/settings/components/PricingForm";
import { useLegacyPortalApi } from "@/core/api/portalApiMode";
import type { TripService } from "@/shared/types";
import {
  useFranchisePricingDetail,
  useUpdateFranchisePricing,
} from "../api/pricing.queries";

interface FranchisePricingEditPageProps {
  pricingId: string;
}

export function FranchisePricingEditPage({ pricingId }: FranchisePricingEditPageProps) {
  const router = useRouter();
  const legacy = useLegacyPortalApi();
  const { data, isLoading, isError } = useFranchisePricingDetail(pricingId);
  const updatePricing = useUpdateFranchisePricing(pricingId);
  const [values, setValues] = useState<PricingFormValues | null>(null);

  useEffect(() => {
    if (data && !values) {
      setValues({
        franchise_id: data.franchise_id,
        franchise_name: data.franchise_name,
        zone_id: null,
        zone_name: data.zone_name,
        rule_name: data.rule_name,
        category_code: data.category_code ?? "ECO",
        service: data.service,
        base_fare_fcfa: data.base_fare_fcfa,
        per_km_fcfa: data.per_km_fcfa,
        min_fare_fcfa: data.min_fare_fcfa,
        surge_multiplier: data.surge_multiplier,
        status: data.status,
      });
    }
  }, [data, values]);

  if (isLoading || !values) {
    return <DetailPageSkeleton title="Grille tarifaire" breadcrumb={["Franchise", "Tarification"]} />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Grille introuvable.{" "}
        <Link href="/franchise/pricing" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  const title = data.rule_name ?? data.zone_name;

  if (legacy) {
    return (
      <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
        <PageHeader
          title={title}
          breadcrumb={["Franchise", "Tarification", data.zone_name]}
        />
        <PricingForm
          mode="edit"
          hideFranchise
          readOnly={false}
          values={values}
          onChange={setValues}
          isSubmitting={updatePricing.isPending}
          onCancel={() => router.push("/franchise/pricing")}
          onSubmit={() => {
            updatePricing.mutate(
              {
                service: values.service,
                rule_name: values.rule_name,
                category_code: values.category_code,
                base_fare_fcfa: values.base_fare_fcfa,
                per_km_fcfa: values.per_km_fcfa,
                min_fare_fcfa: values.min_fare_fcfa,
                surge_multiplier: values.surge_multiplier,
                status: values.status,
              },
              { onSuccess: () => router.push("/franchise/pricing") }
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <div className="sticky top-0 z-10 -mx-6 -mt-2 mb-6 border-b border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-8 md:px-8">
        <PageHeader
          title={title}
          breadcrumb={["Franchise", "Tarification", data.zone_name]}
          actions={
            <Link href="/franchise/pricing">
              <Button variant="secondary">← Retour</Button>
            </Link>
          }
        />
        <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
          <ServicePill service={data.service as TripService} />
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              data.status === "active"
                ? "bg-teal/15 text-teal-dark"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {data.status === "active" ? "En vigueur" : "Brouillon"}
          </span>
          {data.category_code && (
            <span className="rounded-full bg-navy/10 px-2.5 py-1 text-xs font-medium text-navy">
              {data.category_code}
            </span>
          )}
        </p>
      </div>

      <PricingForm
        mode="edit"
        hideFranchise
        readOnly={false}
        values={values}
        onChange={setValues}
        isSubmitting={updatePricing.isPending}
        onCancel={() => router.push("/franchise/pricing")}
        onSubmit={() => {
          updatePricing.mutate(
            {
              service: values.service,
              rule_name: values.rule_name,
              category_code: values.category_code,
              base_fare_fcfa: values.base_fare_fcfa,
              per_km_fcfa: values.per_km_fcfa,
              min_fare_fcfa: values.min_fare_fcfa,
              surge_multiplier: values.surge_multiplier,
              status: values.status,
            },
            { onSuccess: () => router.push("/franchise/pricing") }
          );
        }}
      />
    </div>
  );
}
