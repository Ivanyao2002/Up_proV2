import { PartnerRentalFleetPage } from "@/features/partner/pages/PartnerRentalFleetPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalFleetPage />
    </PartnerModuleGuard>
  );
}
