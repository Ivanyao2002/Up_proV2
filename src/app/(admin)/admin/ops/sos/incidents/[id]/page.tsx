import { SosIncidentDetailPage } from "@/features/safety/pages/SosIncidentDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SosIncidentDetailPage incidentId={id} />;
}
