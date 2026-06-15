import { FranchiseVehicleDetailPage } from "@/features/franchise/pages/FranchiseVehicleDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchiseVehicleDetailPage vehicleId={id} />;
}
