import { FranchiseDriverDetailPage } from "@/features/franchise/pages/FranchiseDriverDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchiseDriverDetailPage driverId={id} />;
}
