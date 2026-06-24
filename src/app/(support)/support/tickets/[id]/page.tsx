import { AgentTicketDetailPage } from "@/features/support/pages/AgentTicketDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <AgentTicketDetailPage ticketId={id} />;
}
