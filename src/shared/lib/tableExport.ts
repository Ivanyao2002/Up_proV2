import type { Column } from "@/shared/ui/DataTable";

function cellExportValue<T>(column: Column<T>, row: T): string {
  if (column.exportValue) {
    const v = column.exportValue(row);
    return v == null ? "" : String(v);
  }
  return "";
}

export function buildExportMatrix<T>(columns: Column<T>[], data: T[]): string[][] {
  const exportColumns = columns.filter((c) => c.exportValue);
  const headers = exportColumns.map((c) => c.header);
  const rows = data.map((row) => exportColumns.map((col) => cellExportValue(col, row)));
  return [headers, ...rows];
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv<T>(
  columns: Column<T>[],
  data: T[],
  fileName: string
): boolean {
  const matrix = buildExportMatrix(columns, data);
  if (matrix[0].length === 0) return false;

  const csv = matrix
    .map((row) => row.map(escapeCsvCell).join(";"))
    .join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${fileName}.csv`);
  return true;
}

export async function downloadExcel<T>(
  columns: Column<T>[],
  data: T[],
  fileName: string
): Promise<boolean> {
  const matrix = buildExportMatrix(columns, data);
  if (matrix[0].length === 0) return false;

  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet(matrix);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Export");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
  return true;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
