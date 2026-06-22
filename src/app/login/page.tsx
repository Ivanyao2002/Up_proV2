import Link from "next/link";
import { AppLogo } from "@/shared/ui/AppLogo";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const portals = [
  {
    title: "Administrateur",
    description: "Plateforme globale · ops, réseau, finance, paramétrage",
    href: "/admin/login",
    tag: "Siège",
  },
  {
    title: "Comptabilité",
    description: "Journal, clôtures, réconciliation et exports",
    href: "/compta/login",
    tag: "Finance",
  },
  {
    title: "Support",
    description: "Réclamations, chat franchises et anomalies",
    href: "/support/login",
    tag: "Support",
  },
  {
    title: "Reporting",
    description: "Tableaux consolidés et exports multi-services",
    href: "/reporting/login",
    tag: "Reporting",
  },
  {
    title: "Partenaire",
    description: "Gestion de votre flotte et wallet cascade",
    href: "/partner/login",
    tag: "Terrain",
  },
  {
    title: "Franchise",
    description: "Territoire, partenaires et bonus zone",
    href: "/franchise/login",
    tag: "Terrain",
  },
  {
    title: "Dispatch",
    description: "Assignation manuelle et console temps réel",
    href: "/dispatch/login",
    tag: "Exploitation",
  },
];

export default function LoginPortalPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <ThemeToggle className="absolute right-6 top-6" />
      <div className="mb-10 flex flex-col items-center text-center">
        <AppLogo size="lg" className="mb-4" />
        <p className="text-muted">Choisissez votre portail</p>
      </div>
      <div className="grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {portals.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className="rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <span className="inline-block rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-dark">
              {portal.tag}
            </span>
            <h2 className="mt-3 font-semibold text-heading">{portal.title}</h2>
            <p className="mt-2 text-sm text-muted">{portal.description}</p>
            <span className="mt-4 inline-block text-sm font-medium text-teal">
              Se connecter →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
