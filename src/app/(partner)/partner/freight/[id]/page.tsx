import { PartnerFreightDetailPage } from "@/features/partner/pages/PartnerFreightDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return <PartnerFreightDetailPage />;
}
