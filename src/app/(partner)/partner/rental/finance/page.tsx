import { PartnerRentalFinancePage } from "@/features/partner/pages/PartnerRentalFinancePage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalFinancePage />
    </PartnerModuleGuard>
  );
}
