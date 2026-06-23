"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Button } from "@/shared/ui/Button";
import {
  useCreateExport,
  useDownloadExport,
  useExports,
  useReportCatalog,
} from "@/features/reporting/api/reporting.queries";
import type { ExportFormat } from "@/features/reporting/api/reporting.types";
import { formatBytes } from "@/features/reporting/utils/reportingFormatters";
import { STATUS_LABEL, STATUS_COLOR } from "@/features/reporting/lib/exportsConstants";

export function ReportingExportsPage() {
  const searchParams = useSearchParams();
  const { data: catalog } = useReportCatalog();
  const { data: exportsData, isLoading } = useExports();
  const createExport = useCreateExport();
  const downloadExport = useDownloadExport();

  const [selectedCode, setSelectedCode] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xlsx");

  const selectedReport = catalog?.data.find((r) => r.code === selectedCode);

  useEffect(() => {
    const reportCode = searchParams.get("report");
    if (reportCode) setSelectedCode(reportCode);
  }, [searchParams]);

  function handleCreate() {
    if (!selectedCode) return;
    createExport.mutate({
      report_code: selectedCode,
      format: selectedFormat,
      filters: {},
    });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="Rapports & exports" breadcrumb={["Reporting", "Exports"]} />
      <p className="-mt-2 mb-6 text-sm text-muted">
        Génération asynchrone de rapports CSV ou XLSX — disponibles au téléchargement dès prêts.
      </p>

      <section className="mb-8 rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-heading">Générer un rapport</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted">Rapport</label>
            <select
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground focus:border-teal focus:outline-none"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
            >
              <option value="">Sélectionner un rapport…</option>
              {catalog?.data.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="mb-1 block text-xs text-muted">Format</label>
            <select
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-foreground focus:border-teal focus:outline-none"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
            >
              {(selectedReport?.formats ?? ["csv", "xlsx"]).map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <Button
            disabled={!selectedCode || createExport.isPending}
            onClick={handleCreate}
          >
            {createExport.isPending ? "Génération…" : "Générer"}
          </Button>
        </div>
        {selectedReport && (
          <p className="mt-2 text-xs text-muted">{selectedReport.description}</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-heading">Historique</h2>
        {downloadExport.isError ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {downloadExport.error instanceof Error
              ? downloadExport.error.message
              : "Le téléchargement a échoué."}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : !exportsData?.data.length ? (
          <div className="rounded-card border border-border bg-surface px-6 py-10 text-center text-sm text-muted shadow-card">
            Aucun export généré.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover text-left text-xs text-muted">
                  <th className="px-4 py-3">Rapport</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Taille</th>
                  <th className="px-4 py-3">Généré le</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exportsData.data.map((exp) => (
                  <tr key={exp.id} className="hover:bg-surface-hover">
                    <td className="px-4 py-3 font-medium text-foreground">{exp.report_label ?? exp.report_code}</td>
                    <td className="px-4 py-3 uppercase text-muted">{exp.format}</td>
                    <td className={`px-4 py-3 ${STATUS_COLOR[exp.status]}`}>{STATUS_LABEL[exp.status]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {exp.file_size_bytes ? formatBytes(exp.file_size_bytes) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(exp.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {exp.status === "ready" && (
                        <button
                          type="button"
                          className="text-sm font-medium text-teal hover:underline disabled:cursor-wait disabled:opacity-60"
                          disabled={
                            downloadExport.isPending &&
                            downloadExport.variables?.id === exp.id
                          }
                          onClick={() => downloadExport.mutate(exp)}
                        >
                          {downloadExport.isPending &&
                          downloadExport.variables?.id === exp.id
                            ? "Téléchargement…"
                            : "Télécharger"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
