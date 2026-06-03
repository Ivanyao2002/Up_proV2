import Link from "next/link";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";

const portals = [
  {
    title: "Administrateur",
    description: "Plateforme globale · ops, réseau, finance",
    href: "/admin/login",
  },
  {
    title: "Partenaire",
    description: "Gestion de votre flotte",
    href: "/partner/login",
  },
  {
    title: "Franchise",
    description: "Territoire et sous-partenaires",
    href: "/franchise/login",
  },
  {
    title: "Dispatch",
    description: "Assignation & réservation manuelle",
    href: "/dispatch/login",
  },
];

export default function LoginPortalPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas p-6">
      <ThemeToggle className="absolute right-6 top-6" />
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold text-heading">UpJunoo Pro</h1>
        <p className="mt-2 text-muted">Choisissez votre portail</p>
      </div>
      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {portals.map((portal) => (
          <Link
            key={portal.href}
            href={portal.href}
            className="rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <h2 className="font-semibold text-heading">{portal.title}</h2>
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
