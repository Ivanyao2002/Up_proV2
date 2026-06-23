import { http, HttpResponse } from "msw";
import overviewSeed from "../data/reporting-overview.json";
import activitySeed from "../data/reporting-activity.json";
import financeSeed from "../data/reporting-finance.json";
import qualitySeed from "../data/reporting-quality.json";
import governanceSeed from "../data/reporting-governance.json";
import exportsSeed from "../data/reporting-exports.json";
import filterOptionsSeed from "../data/reporting-filter-options.json";
import type { ExportJob } from "@/features/reporting/api/reporting.types";

let exportsState: ExportJob[] = JSON.parse(JSON.stringify(exportsSeed.exports));

export const reportingHandlers = [
  http.get("*/v1/reporting/filter-options", () =>
    HttpResponse.json(filterOptionsSeed)
  ),

  http.get("*/v1/reporting/overview", () =>
    HttpResponse.json(overviewSeed)
  ),

  http.get("*/v1/reporting/activity", () =>
    HttpResponse.json(activitySeed)
  ),

  http.get("*/v1/reporting/finance", () =>
    HttpResponse.json(financeSeed)
  ),

  http.get("*/v1/reporting/quality", () =>
    HttpResponse.json(qualitySeed)
  ),

  http.get("*/v1/reporting/governance", () =>
    HttpResponse.json(governanceSeed)
  ),

  http.get("*/v1/reporting/reports", () =>
    HttpResponse.json({ data: exportsSeed.catalog })
  ),

  http.get("*/v1/reporting/exports", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status
      ? exportsState.filter((e) => e.status === status)
      : exportsState;
    return HttpResponse.json({
      data: filtered,
      meta: { total: filtered.length, per_page: 25, current_page: 1, last_page: 1 },
    });
  }),

  http.get("*/v1/reporting/exports/:id", ({ params }) => {
    const found = exportsState.find((e) => e.id === params.id);
    if (!found) return HttpResponse.json({ message: "Export introuvable", code: "EXPORT_NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(found);
  }),

  http.post("*/v1/reporting/exports", async ({ request }) => {
    const body = await request.json() as { report_code: string; format: string };
    const catalogItem = exportsSeed.catalog.find((c) => c.code === body.report_code);
    const newExport: ExportJob = {
      id: `exp-${Date.now()}`,
      report_code: body.report_code,
      report_label: catalogItem?.label ?? body.report_code,
      format: body.format as "csv" | "xlsx",
      status: "queued",
      created_by: { id: "usr-10", name: "Analyste Reporting" },
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: null,
      file_size_bytes: null,
      error_message: null,
    };
    exportsState.unshift(newExport);

    // Simulate async processing — mark ready after a short delay
    setTimeout(() => {
      const idx = exportsState.findIndex((e) => e.id === newExport.id);
      if (idx !== -1) {
        exportsState[idx] = {
          ...exportsState[idx],
          status: "ready",
          completed_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          file_size_bytes: Math.floor(Math.random() * 400000) + 50000,
        };
      }
    }, 4000);

    return HttpResponse.json(newExport, { status: 202 });
  }),

  http.get("*/v1/reporting/exports/:id/download", async ({ params }) => {
    const found = exportsState.find((e) => e.id === params.id);
    if (!found) return HttpResponse.json({ message: "Export introuvable", code: "EXPORT_NOT_FOUND" }, { status: 404 });
    if (found.status !== "ready") return HttpResponse.json({ message: "Fichier non disponible", code: "EXPORT_NOT_READY" }, { status: 409 });

    const rows = [
      ["Rapport", found.report_label ?? found.report_code],
      ["Identifiant", found.id],
      ["Statut", found.status],
      ["Généré le", found.completed_at ?? found.created_at],
    ];

    if (found.format === "xlsx") {
      const XLSX = await import("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rapport");
      const file = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      return new HttpResponse(file, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${found.report_code}.xlsx"`,
        },
      });
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";"))
      .join("\r\n");
    return new HttpResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${found.report_code}.csv"`,
      },
    });
  }),
];
