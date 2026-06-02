import { ZoneDetailPage } from "@/features/network/pages/ZoneDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ZoneDetailPage zoneId={id} />;
}
