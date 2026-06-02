import { PartnerDetailPage } from "@/features/network/pages/PartnerDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PartnerDetailPage partnerId={id} />;
}
