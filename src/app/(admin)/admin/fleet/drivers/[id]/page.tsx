import { DriverDetailPage } from "@/features/fleet/pages/DriverDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DriverDetailPage driverId={id} />;
}
