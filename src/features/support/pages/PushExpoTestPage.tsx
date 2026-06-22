"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import { usePushExpoConfig, useSendPushTest } from "../api/pushExpo.queries";

export function PushExpoTestPage() {
  const { data: config, isLoading: configLoading } = usePushExpoConfig();
  const send = useSendPushTest();
  const [title, setTitle] = useState("Test Upjunoo");
  const [body, setBody] = useState("Ceci est un message de test");

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Notifications push (Expo)"
        breadcrumb={["Admin", "Support", "Push Expo"]}
      />

      <div className="mt-6 space-y-6">
        {/* Config */}
        <section className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
          {configLoading ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : config ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Project ID</dt>
                <dd className="text-sm font-medium">{config.projectId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Expo Token</dt>
                <dd className="text-sm font-medium">{config.expoToken ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Activé</dt>
                <dd className="text-sm font-medium">
                  {config.enabled ? "Oui" : "Non"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-red-600">Impossible de charger la configuration.</p>
          )}
        </section>

        {/* Test */}
        <section className="rounded-card border border-border bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">Envoyer une notification de test</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Titre</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none ring-teal/30 focus:ring-2"
              />
            </div>
            <Button
              onClick={() => send.mutate({ title, body })}
              disabled={send.isPending || !title.trim() || !body.trim()}
            >
              {send.isPending ? "Envoi…" : "Envoyer la notification"}
            </Button>

            {send.isSuccess && (
              <div className="rounded-lg bg-teal/10 p-3 text-sm text-teal-dark">
                <p>Statut : {send.data.status}</p>
                <p>
                  Push : {send.data.push?.sent ? "Envoyé" : "Non envoyé"}
                  {send.data.push?.reason && ` (${send.data.push.reason})`}
                </p>
                {send.data.push?.providerRef && (
                  <p className="text-xs text-muted">Ref : {send.data.push.providerRef}</p>
                )}
              </div>
            )}

            {send.isError && (
              <p className="text-sm text-red-600">
                Erreur lors de l&apos;envoi.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
