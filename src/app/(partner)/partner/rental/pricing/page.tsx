import { PartnerRentalPricingPage } from "@/features/partner/pages/PartnerRentalPricingPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalPricingPage />
    </PartnerModuleGuard>
  );
}
