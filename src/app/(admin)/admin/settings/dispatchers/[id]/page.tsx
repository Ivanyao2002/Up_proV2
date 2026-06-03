import { DispatcherDetailPage } from "@/features/settings/pages/DispatcherDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DispatcherDetailPage dispatcherId={id} />;
}
