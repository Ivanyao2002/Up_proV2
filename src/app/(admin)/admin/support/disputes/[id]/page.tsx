import { SupportDisputeDetailPage } from "@/features/support/pages/SupportDisputeDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupportDisputeDetailPage disputeId={id} />;
}
