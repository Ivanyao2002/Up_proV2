import { TripDetailPage } from "@/features/ops/pages/TripDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripDetailPage tripId={id} />;
}
