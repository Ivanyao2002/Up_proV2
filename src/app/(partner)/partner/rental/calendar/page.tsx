import { PartnerRentalCalendarPage } from "@/features/partner/pages/PartnerRentalCalendarPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="rental">
      <PartnerRentalCalendarPage />
    </PartnerModuleGuard>
  );
}
