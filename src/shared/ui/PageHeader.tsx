import { Fragment } from "react";
import Link from "next/link";

export type BreadcrumbItem = string | { label: string; href?: string };

interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

function normalizeBreadcrumb(item: BreadcrumbItem): { label: string; href?: string } {
  return typeof item === "string" ? { label: item } : item;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            className="mb-1 truncate text-xs text-muted"
            aria-label="Fil d'Ariane"
          >
            {breadcrumb.map((raw, index) => {
              const { label, href } = normalizeBreadcrumb(raw);
              const isLast = index === breadcrumb.length - 1;
              return (
                <Fragment key={`${label}-${index}`}>
                  {index > 0 && <span aria-hidden="true"> / </span>}
                  {href && !isLast ? (
                    <Link
                      href={href}
                      className="rounded transition-colors hover:text-foreground hover:underline"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? "page" : undefined}>{label}</span>
                  )}
                </Fragment>
              );
            })}
          </nav>
        )}
        <h1 className="text-lg font-semibold tracking-tight text-heading sm:text-[22px]">
          {title}
        </h1>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
