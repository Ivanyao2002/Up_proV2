import { PartnerRentalDetailPage } from "@/features/partner/pages/PartnerRentalDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <PartnerRentalDetailPage />;
}
