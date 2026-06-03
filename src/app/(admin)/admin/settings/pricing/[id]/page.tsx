import { PricingEditPage } from "@/features/settings/pages/PricingEditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PricingEditPage pricingId={id} />;
}
