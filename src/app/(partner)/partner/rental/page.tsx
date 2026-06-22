import { PartnerRentalPage } from "@/features/partner/pages/PartnerRentalPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalPage />
    </PartnerModuleGuard>
  );
}
