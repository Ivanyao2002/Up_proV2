import { PartnerChatConversationDetailPage } from "@/features/partner/pages/PartnerChatConversationDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PartnerChatConversationDetailRoute({ params }: Props) {
  const { id } = await params;
  return <PartnerChatConversationDetailPage conversationId={id} />;
}
