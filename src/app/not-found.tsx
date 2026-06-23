import Link from "next/link";
import { AppLogo } from "@/shared/ui/AppLogo";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
      <AppLogo size="lg" />
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-dark">
          Erreur 404
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-heading">
          Page introuvable
        </h1>
        <p className="max-w-md text-sm text-muted">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-dark"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
