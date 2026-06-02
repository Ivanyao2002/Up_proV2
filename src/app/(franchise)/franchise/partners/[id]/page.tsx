import { FranchisePartnerDetailPage } from "@/features/franchise/pages/FranchisePartnerDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchisePartnerDetailPage partnerId={id} />;
}
