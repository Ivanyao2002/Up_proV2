import { PartnerRentalVehicleCreatePage } from "@/features/partner/pages/PartnerRentalVehicleCreatePage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalVehicleCreatePage />
    </PartnerModuleGuard>
  );
}
