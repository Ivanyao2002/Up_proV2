import { FranchiseDetailPage } from "@/features/network/pages/FranchiseDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FranchiseDetailPage franchiseId={id} />;
}
