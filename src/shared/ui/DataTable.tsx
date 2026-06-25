"use client";

import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { downloadCsv, downloadExcel } from "@/shared/lib/tableExport";
import { notificationService } from "@/core/http/notificationService";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Valeur texte pour l'export CSV / Excel */
  exportValue?: (row: T) => string | number | null | undefined;
  /** Clé de tri — si fournie, la colonne est triable côté client */
  sortKey?: (row: T) => string | number | null | undefined;
  /** Champ de tri serveur — si fourni et que la table est en mode serveur avec
   *  `serverPagination.onSortChange`, la colonne devient triable côté serveur. */
  sortField?: string;
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
  /** Champ de tri serveur actif. */
  sort?: string;
  /** Sens de tri serveur actif. */
  order?: "asc" | "desc";
  /** Déclenché au clic sur un en-tête `sortField` (mode serveur). */
  onSortChange?: (field: string) => void;
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
  /** En pagination serveur : récupère TOUTES les lignes (toutes pages) pour
   *  l'export. Si fourni, l'export ne se limite plus à la page affichée. */
  onExportAll?: () => Promise<T[]>;
  /** Hauteur des lignes : default 52px, compact 40px */
  rowHeight?: DataTableRowHeight;
  /** Classes CSS additionnelles par ligne */
  getRowClassName?: (row: T) => string | undefined;
  /** Clic sur une ligne (hors cases à cocher / boutons) */
  onRowClick?: (row: T) => void;
  /** Libellé accessible de la ligne cliquable (pour le clavier / lecteurs d'écran) */
  rowAriaLabel?: (row: T) => string;
  /** Affiche un état d'erreur dans le corps du tableau (en gardant l'en-tête) */
  isError?: boolean;
  /** Message d'erreur contextualisé */
  errorMessage?: string;
  /** Callback du bouton « Réessayer » de l'état d'erreur */
  onRetry?: () => void;
  /** Indique qu'un ou plusieurs filtres sont actifs (état vide contextualisé) */
  hasActiveFilters?: boolean;
  /** Callback du bouton « Réinitialiser les filtres » de l'état vide */
  onResetFilters?: () => void;
  /** Rend la 1ère colonne (et la colonne de sélection) en position sticky */
  stickyFirstColumn?: boolean;
  /** Rend une vue cartes empilées sous le breakpoint md (table masquée sous md) */
  renderCard?: (row: T) => ReactNode;
}

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500];

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
            <td key={j} className="px-3 sm:px-6">
              <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-navy/10 dark:bg-white/10" />
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
  getRowClassName,
  onExportAll,
  onRowClick,
  rowAriaLabel,
  isError,
  errorMessage,
  onRetry,
  hasActiveFilters,
  onResetFilters,
  stickyFirstColumn,
  renderCard,
}: DataTableProps<T>) {
  const serverMode = Boolean(serverPagination);
  const paginationEnabled = !serverMode && pagination !== false;
  const basePageSizeOptions =
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
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(colId);
      setSortDir("asc");
    }
    if (!serverMode) setPage(1);
  };

  const rowClass = rowHeight === "compact" ? "h-10" : "h-[52px]";
  const colCount = columns.length + (selectable ? 1 : 0);
  const hasExport = Boolean(exportFileName) && columns.some((c) => c.exportValue);

  // Classes sticky pour la 1ère colonne (et la colonne de sélection) sur tables larges (#30).
  const stickySelectClass = stickyFirstColumn
    ? "sticky left-0 z-[1] bg-surface"
    : "";
  const stickyFirstColClass = stickyFirstColumn
    ? `sticky ${selectable ? "left-12" : "left-0"} z-[1] bg-surface`
    : "";

  const activePage = serverMode ? serverPagination!.page : page;
  const activePageSize = serverMode ? serverPagination!.pageSize : pageSize;
  const totalItems = serverMode ? serverPagination!.total : data.length;

  // Le serveur peut renvoyer une limite différente de celle demandée (ex. cap à
  // 20 alors qu'on demande 25). Sans cela, `<select value={20}>` ne trouve pas
  // l'option et retombe sur la 1ère valeur affichée (« 10 ») — on garantit donc
  // que la taille de page active figure toujours dans les options.
  const pageSizeOptions = basePageSizeOptions.includes(activePageSize)
    ? basePageSizeOptions
    : [...basePageSizeOptions, activePageSize].sort((a, b) => a - b);
  const totalPages = serverMode
    ? serverPagination!.lastPage
    : Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (!serverMode) setPage(1);
  }, [data.length, pageSize, serverMode]);

  useEffect(() => {
    if (!serverMode && page > totalPages) setPage(totalPages);
  }, [page, totalPages, serverMode]);

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    const col = columns.find(c => c.id === sortCol);
    if (!col?.sortKey) return data;
    return [...data].sort((a, b) => {
      const va = col.sortKey!(a) ?? "";
      const vb = col.sortKey!(b) ?? "";
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, columns, sortCol, sortDir]);

  const visibleData = useMemo(() => {
    if (serverMode || !paginationEnabled) return sortedData;
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, paginationEnabled, serverMode]);

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
    // En pagination serveur sans `onExportAll`, l'export ne porte que sur la page
    // chargée — le dire explicitement plutôt que de laisser croire à un export
    // complet (#6 audit UX).
    if (serverMode && !onExportAll && totalItems > data.length) {
      notificationService.warning(
        `Export limité à la page affichée (${data.length} sur ${totalItems} lignes).`
      );
    }
    setExporting(format);
    try {
      // Avec `onExportAll`, on récupère toutes les pages avant d'exporter.
      let exportRows = data;
      if (serverMode && onExportAll) {
        try {
          exportRows = await onExportAll();
        } catch {
          notificationService.error("Échec de la récupération des lignes à exporter");
          return;
        }
      }
      const ok =
        format === "csv"
          ? downloadCsv(columns, exportRows, exportFileName)
          : await downloadExcel(columns, exportRows, exportFileName);
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
              <span className="text-xs font-medium text-muted">
                Exporter
                {serverMode && !onExportAll && totalItems > data.length ? (
                  <span className="ml-1 font-normal text-amber-600">
                    (page affichée)
                  </span>
                ) : null}
              </span>
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

      {selectable && allSelected && totalItems > activePageSize && (
        <div className="border-b border-border bg-teal/[0.06] px-4 py-2 text-center text-xs text-foreground sm:px-6">
          Les {data.length} de cette page sont sélectionnés.
        </div>
      )}

      <div
        className={`overflow-x-auto overflow-y-auto ${renderCard ? "hidden md:block" : ""}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              {selectable && (
                <th className={`w-12 px-3 py-3 sm:px-6 ${stickySelectClass}`}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border text-teal focus:ring-teal"
                    aria-label="Tout sélectionner (page)"
                  />
                </th>
              )}
              {columns.map((col, colIndex) => {
                // Tri serveur : actif si la table est en mode serveur, qu'un
                // `onSortChange` est fourni et que la colonne déclare un `sortField`.
                const serverSortable =
                  serverMode &&
                  Boolean(serverPagination?.onSortChange) &&
                  Boolean(col.sortField);
                // Tri client : seulement hors mode serveur (sinon il ne porterait
                // que sur la page affichée — décision trompeuse, #5 audit UX).
                const clientSortable = Boolean(col.sortKey) && !serverMode;
                const isSortable = serverSortable || clientSortable;
                const isActive = serverSortable
                  ? serverPagination?.sort === col.sortField
                  : sortCol === col.id;
                const activeDir = serverSortable
                  ? serverPagination?.order ?? "desc"
                  : sortDir;
                const onHeaderSort = serverSortable
                  ? () => serverPagination?.onSortChange?.(col.sortField!)
                  : () => handleSort(col.id);
                return (
                  <th
                    key={col.id}
                    className={`px-3 py-3 font-medium sm:px-6 ${
                      colIndex === 0 ? stickyFirstColClass : ""
                    } ${col.className ?? ""}`}
                    aria-sort={isActive ? (activeDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={onHeaderSort}
                        aria-label={`Trier par ${typeof col.header === "string" ? col.header : col.id}`}
                        className="inline-flex select-none items-center gap-1 rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-teal"
                      >
                        {col.header}
                        <span className={`text-[10px] ${isActive ? "text-teal" : "text-muted/40"}`}>
                          {isActive ? (activeDir === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {col.header}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading && <SkeletonRows cols={colCount} rowClass={rowClass} />}
            {!isLoading && isError && (
              <tr>
                <td colSpan={colCount} className="px-3 py-12 sm:px-6">
                  <ErrorState
                    message={
                      errorMessage ??
                      "Impossible de charger les données. Veuillez réessayer."
                    }
                    onRetry={onRetry}
                  />
                </td>
              </tr>
            )}
            {!isLoading && !isError && data.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-3 py-12 sm:px-6">
                  {hasActiveFilters ? (
                    <EmptyState
                      title="Aucun résultat pour ces filtres"
                      description="Essayez d'élargir ou de réinitialiser vos critères de recherche."
                      actionLabel={onResetFilters ? "Réinitialiser les filtres" : undefined}
                      onAction={onResetFilters}
                    />
                  ) : (
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  )}
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              visibleData.map((row) => {
                const key = rowKey(row);
                const selected = selectedKeys?.has(key);
                const extraRowClass = getRowClassName?.(row) ?? "";
                const handleRowActivate = () => {
                  if (!onRowClick) return;
                  onRowClick(row);
                };
                const handleRowKeyDown = onRowClick
                  ? (e: ReactKeyboardEvent<HTMLTableRowElement>) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button, a, input, select, textarea, [data-row-action]")
                      ) {
                        return;
                      }
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined;
                return (
                  <tr
                    key={key}
                    className={`${rowClass} border-t border-border/50 transition-colors duration-120 hover:bg-surface-hover/80 ${
                      selected ? "bg-teal/[0.04]" : ""
                    } ${extraRowClass} ${
                      onRowClick
                        ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
                        : ""
                    }`}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    aria-label={onRowClick ? rowAriaLabel?.(row) : undefined}
                    onClick={
                      onRowClick
                        ? (e) => {
                            const target = e.target as HTMLElement;
                            if (
                              target.closest("button, a, input, select, textarea, [data-row-action]")
                            ) {
                              return;
                            }
                            handleRowActivate();
                          }
                        : undefined
                    }
                    onKeyDown={handleRowKeyDown}
                  >
                    {selectable && (
                      <td className={`px-3 sm:px-6 ${stickySelectClass}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(key)}
                          className="rounded border-border text-teal focus:ring-teal"
                          aria-label="Sélectionner la ligne"
                        />
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td
                        key={col.id}
                        className={`px-3 sm:px-6 ${
                          colIndex === 0 ? stickyFirstColClass : ""
                        } ${col.className ?? ""}`}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {renderCard && (
        <div className="space-y-3 p-3 md:hidden sm:p-4">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-card border border-border/50 bg-navy/[0.03] dark:bg-white/[0.03]"
              />
            ))}
          {!isLoading && isError && (
            <ErrorState
              message={
                errorMessage ??
                "Impossible de charger les données. Veuillez réessayer."
              }
              onRetry={onRetry}
            />
          )}
          {!isLoading && !isError && data.length === 0 && (
            hasActiveFilters ? (
              <EmptyState
                title="Aucun résultat pour ces filtres"
                description="Essayez d'élargir ou de réinitialiser vos critères de recherche."
                actionLabel={onResetFilters ? "Réinitialiser les filtres" : undefined}
                onAction={onResetFilters}
              />
            ) : (
              <EmptyState title={emptyTitle} description={emptyDescription} />
            )
          )}
          {!isLoading &&
            !isError &&
            visibleData.map((row) => {
              const key = rowKey(row);
              if (onRowClick) {
                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    aria-label={rowAriaLabel?.(row)}
                    className="cursor-pointer rounded-card outline-none focus-visible:ring-2 focus-visible:ring-teal"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button, a, input, select, textarea, [data-row-action]")
                      ) {
                        return;
                      }
                      onRowClick(row);
                    }}
                    onKeyDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("button, a, input, select, textarea, [data-row-action]")
                      ) {
                        return;
                      }
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }}
                  >
                    {renderCard(row)}
                  </div>
                );
              }
              return <div key={key}>{renderCard(row)}</div>;
            })}
        </div>
      )}

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
