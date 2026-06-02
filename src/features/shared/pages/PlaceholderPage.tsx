import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState } from "@/shared/ui/EmptyState";

interface PlaceholderPageProps {
  title: string;
  breadcrumb?: string[];
  description?: string;
}

export function PlaceholderPage({
  title,
  breadcrumb,
  description = "Cette page sera disponible dans une prochainement.",
}: PlaceholderPageProps) {
  return (
    <div className="animate-fade-up">
      <PageHeader title={title} breadcrumb={breadcrumb} />
      <EmptyState title="En construction" description={description} />
    </div>
  );
}
