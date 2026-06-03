import { TripForensicPage } from "@/features/ops/pages/TripForensicPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TripForensicPage tripId={id} />;
}
