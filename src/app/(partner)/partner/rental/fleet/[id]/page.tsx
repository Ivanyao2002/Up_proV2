import { PartnerRentalVehicleDetailPage } from "@/features/partner/pages/PartnerRentalVehicleDetailPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalVehicleDetailPage />
    </PartnerModuleGuard>
  );
}
