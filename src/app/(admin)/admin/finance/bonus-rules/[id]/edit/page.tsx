import { BonusRuleEditPage } from "@/features/finance/pages/BonusRuleEditPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BonusRuleEditPage ruleId={id} />;
}
