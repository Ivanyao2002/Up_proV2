"use client";

import { DetailPageSkeleton } from "@/shared/ui/skeletons";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "../components/PricingForm";
import { usePricingDetail, usePricingList, useUpdatePricingRule } from "../api/pricing.queries";

interface PricingEditPageProps {
  pricingId: string;
}

export function PricingEditPage({ pricingId }: PricingEditPageProps) {
  const router = useRouter();
  const { data, isLoading, isError } = usePricingDetail(pricingId);
  const { data: pricingMeta } = usePricingList({ per_page: 1 });
  const updatePricing = useUpdatePricingRule(pricingId);
  const franchiseOptions = pricingMeta?.filter_options?.franchises ?? [];
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
    return <DetailPageSkeleton />;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Grille introuvable.{" "}
        <Link href="/admin/settings/pricing" className="text-teal underline">
          Retour
        </Link>
      </p>
    );
  }

  return (
    <div className="animate-fade-up mx-auto w-full max-w-3xl px-4 pb-10">
      <PageHeader
        title={`${data.franchise_name} — ${data.zone_name}`}
        breadcrumb={[
          "Admin",
          "Paramètres",
          "Tarification",
          data.franchise_name,
          data.zone_name,
        ]}
      />

      <PricingForm
        mode="edit"
        values={values}
        franchiseOptions={franchiseOptions}
        onChange={setValues}
        isSubmitting={updatePricing.isPending}
        onCancel={() => router.push("/admin/settings/pricing")}
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
              effectiveFrom: values.effectiveFrom,
            },
            { onSuccess: () => router.push("/admin/settings/pricing") }
          );
        }}
      />
    </div>
  );
}
