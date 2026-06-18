import { PartnerOrderDetailPage } from "@/features/partner/pages/PartnerOrderDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerOrderDetailPage orderId={id} />;
}
