import { ClientDetailPage } from "@/features/fleet/pages/ClientDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientDetailPage clientId={id} />;
}
