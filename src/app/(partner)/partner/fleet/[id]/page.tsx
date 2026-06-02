import { PartnerVehicleDetailPage } from "@/features/partner/pages/PartnerVehicleDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerVehicleDetailPage vehicleId={id} />;
}
