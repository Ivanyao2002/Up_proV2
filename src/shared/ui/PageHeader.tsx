interface PageHeaderProps {
  title: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-1 text-xs text-muted" aria-label="Fil d'Ariane">
            {breadcrumb.join(" / ")}
          </nav>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-heading">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
