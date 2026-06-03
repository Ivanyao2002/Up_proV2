import { RoleDetailPage } from "@/features/settings/pages/RoleDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoleDetailPage roleId={id} />;
}
