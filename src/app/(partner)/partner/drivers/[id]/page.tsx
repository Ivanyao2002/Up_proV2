import { PartnerDriverDetailPage } from "@/features/partner/pages/PartnerDriverDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerDriverDetailPage driverId={id} />;
}
