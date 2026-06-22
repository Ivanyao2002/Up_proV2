import { PartnerFreightPage } from "@/features/partner/pages/PartnerFreightPage";
import { PartnerModuleGuard } from "@/features/partner/components/PartnerModuleGuard";

export default function Page() {
  return (
    <PartnerModuleGuard module="freight">
      <PartnerFreightPage />
    </PartnerModuleGuard>
  );
}
