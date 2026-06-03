"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { downloadCsv, downloadExcel } from "@/shared/lib/tableExport";
import { notificationService } from "@/core/http/notificationService";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Valeur texte pour l'export CSV / Excel */
  exportValue?: (row: T) => string | number | null | undefined;
  className?: string;
}

export type DataTablePagination =
  | boolean
  | {
      pageSize?: number;
      pageSizeOptions?: number[];
    };

export type DataTableRowHeight = "default" | "compact";

export interface DataTableServerPagination {
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  footer?: ReactNode;
  /** Pagination client (recommandé au-delà de ~50 lignes) */
  pagination?: DataTablePagination;
  /** Pagination serveur — `data` = page courante uniquement */
  serverPagination?: DataTableServerPagination;
  /** Hauteur max du corps du tableau avec défilement */
  maxHeight?: string;
  /** Nom de fichier sans extension pour export CSV / Excel */
  exportFileName?: string;
  /** Hauteur des lignes : default 52px, compact 40px */
  rowHeight?: DataTableRowHeight;
}

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function SkeletonRows({
  cols,
  rowClass,
}: {
  cols: number;
  rowClass: string;
}) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className={`${rowClass} border-t border-border/50`}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-6">
              <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-border" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  isLoading,
  emptyTitle = "Aucune donnée",
  emptyDescription,
  selectable,
  selectedKeys,
  onSelectionChange,
  footer,
  pagination = true,
  serverPagination,
  maxHeight = "520px",
  exportFileName,
  rowHeight = "default",
}: DataTableProps<T>) {
  const serverMode = Boolean(serverPagination);
  const paginationEnabled = !serverMode && pagination !== false;
  const pageSizeOptions =
    pagination !== false && typeof pagination === "object" && pagination.pageSizeOptions
      ? pagination.pageSizeOptions
      : DEFAULT_PAGE_SIZE_OPTIONS;
  const initialPageSize =
    pagination !== false && typeof pagination === "object" && pagination.pageSize
      ? pagination.pageSize
      : DEFAULT_PAGE_SIZE;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  const rowClass = rowHeight === "compact" ? "h-10" : "h-[52px]";
  const colCount = columns.length + (selectable ? 1 : 0);
  const hasExport = Boolean(exportFileName) && columns.some((c) => c.exportValue);

  const activePage = serverMode ? serverPagination!.page : page;
  const activePageSize = serverMode ? serverPagination!.pageSize : pageSize;
  const totalItems = serverMode ? serverPagination!.total : data.length;
  const totalPages = serverMode
    ? serverPagination!.lastPage
    : Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (!serverMode) setPage(1);
  }, [data.length, pageSize, serverMode]);

  useEffect(() => {
    if (!serverMode && page > totalPages) setPage(totalPages);
  }, [page, totalPages, serverMode]);

  const visibleData = useMemo(() => {
    if (serverMode || !paginationEnabled) return data;
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, paginationEnabled, serverMode]);

  const allSelected =
    data.length > 0 && data.every((row) => selectedKeys?.has(rowKey(row)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((row) => rowKey(row))));
    }
  };

  const toggleRow = (key: string | number) => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!exportFileName || !hasExport) {
      notificationService.warning("Export non configuré pour ce tableau");
      return;
    }
    setExporting(format);
    try {
      const ok =
        format === "csv"
          ? downloadCsv(columns, data, exportFileName)
          : await downloadExcel(columns, data, exportFileName);
      if (ok) {
        notificationService.success(
          format === "csv" ? "Export CSV téléchargé" : "Export Excel téléchargé"
        );
      } else {
        notificationService.warning("Aucune colonne exportable");
      }
    } catch {
      notificationService.error("Échec de l'export");
    } finally {
      setExporting(null);
    }
  };

  const rangeStart =
    totalItems === 0 ? 0 : (activePage - 1) * activePageSize + 1;
  const rangeEnd = serverMode
    ? Math.min(activePage * activePageSize, totalItems)
    : Math.min(activePage * activePageSize, data.length);

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {(hasExport || paginationEnabled || serverMode) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          {hasExport ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Exporter</span>
              <Button
                type="button"
                variant="secondary"
                className="!px-2.5 !py-1 !text-xs"
                disabled={Boolean(exporting) || data.length === 0}
                onClick={() => void handleExport("csv")}
              >
                {exporting === "csv" ? "…" : "CSV"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="!px-2.5 !py-1 !text-xs"
                disabled={Boolean(exporting) || data.length === 0}
                onClick={() => void handleExport("xlsx")}
              >
                {exporting === "xlsx" ? "…" : "Excel"}
              </Button>
            </div>
          ) : (
            <span />
          )}

          {(paginationEnabled || serverMode) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <label className="flex items-center gap-2">
                Lignes / page
                <select
                  value={activePageSize}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (serverMode) {
                      serverPagination?.onPageSizeChange?.(next);
                    } else {
                      setPageSize(next);
                    }
                  }}
                  className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-foreground"
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
      )}

      <div
        className="overflow-x-auto overflow-y-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              {selectable && (
                <th className="w-12 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border text-teal focus:ring-teal"
                    aria-label="Tout sélectionner"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.id} className={`px-6 py-3 font-medium ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows cols={colCount} rowClass={rowClass} />}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-6 py-16 text-center">
                  <p className="font-medium text-foreground">{emptyTitle}</p>
                  {emptyDescription && (
                    <p className="mt-1 text-sm text-muted">{emptyDescription}</p>
                  )}
                </td>
              </tr>
            )}
            {!isLoading &&
              visibleData.map((row) => {
                const key = rowKey(row);
                const selected = selectedKeys?.has(key);
                return (
                  <tr
                    key={key}
                    className={`${rowClass} border-t border-border/50 transition-colors duration-120 hover:bg-surface-hover/80 ${
                      selected ? "bg-teal/[0.04]" : ""
                    }`}
                  >
                    {selectable && (
                      <td className="px-6">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(key)}
                          className="rounded border-border text-teal focus:ring-teal"
                          aria-label="Sélectionner la ligne"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.id} className={`px-6 ${col.className ?? ""}`}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {(footer || paginationEnabled || serverMode) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:px-6">
          <div>{footer}</div>
          {(paginationEnabled || serverMode) && totalItems > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs tabular-nums">
                {rangeStart}–{rangeEnd} sur {totalItems.toLocaleString("fr-CI")}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="!px-2 !py-1 !text-xs"
                disabled={activePage <= 1}
                onClick={() => {
                  if (serverMode) {
                    serverPagination?.onPageChange(activePage - 1);
                  } else {
                    setPage((p) => Math.max(1, p - 1));
                  }
                }}
              >
                Préc.
              </Button>
              <span className="text-xs tabular-nums">
                {activePage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                className="!px-2 !py-1 !text-xs"
                disabled={activePage >= totalPages}
                onClick={() => {
                  if (serverMode) {
                    serverPagination?.onPageChange(activePage + 1);
                  } else {
                    setPage((p) => Math.min(totalPages, p + 1));
                  }
                }}
              >
                Suiv.
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
