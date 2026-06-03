"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import {
  PricingForm,
  type PricingFormValues,
} from "../components/PricingForm";
import { usePricingDetail, useUpdatePricingRule } from "../api/pricing.queries";

interface PricingEditPageProps {
  pricingId: string;
}

export function PricingEditPage({ pricingId }: PricingEditPageProps) {
  const router = useRouter();
  const { data, isLoading, isError } = usePricingDetail(pricingId);
  const updatePricing = useUpdatePricingRule(pricingId);
  const [values, setValues] = useState<PricingFormValues | null>(null);

  useEffect(() => {
    if (data && !values) {
      setValues({
        zone_id: null,
        zone_name: data.zone_name,
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
    return <div className="h-64 animate-pulse rounded-card bg-border" />;
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
        title={`${data.zone_name} · ${data.service}`}
        breadcrumb={["Admin", "Paramètres", "Tarification", data.zone_name]}
      />

      <PricingForm
        mode="edit"
        values={values}
        onChange={setValues}
        isSubmitting={updatePricing.isPending}
        onCancel={() => router.push("/admin/settings/pricing")}
        onSubmit={() => {
          updatePricing.mutate(
            {
              service: values.service,
              base_fare_fcfa: values.base_fare_fcfa,
              per_km_fcfa: values.per_km_fcfa,
              min_fare_fcfa: values.min_fare_fcfa,
              surge_multiplier: values.surge_multiplier,
              status: values.status,
            },
            { onSuccess: () => router.push("/admin/settings/pricing") }
          );
        }}
      />
    </div>
  );
}
