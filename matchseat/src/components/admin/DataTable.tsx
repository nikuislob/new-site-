import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: keyof T | string;
  header: React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyState?: React.ReactNode;
  className?: string;
};

function fallbackCell<T>(row: T, key: keyof T | string): React.ReactNode {
  const value = (row as Record<string, unknown>)[String(key)];
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return value;
  return String(value);
}

export function DataTable<T>({ columns, rows, rowKey, emptyState, className }: DataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-[#0a1628] text-left text-xs font-black uppercase tracking-wide text-slate-200">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} scope="col" className={cn("px-4 py-3", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={rowKey(row, index)} className="transition hover:bg-emerald-50/50">
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn("px-4 py-4 align-top text-slate-700", column.className)}>
                      {column.cell ? column.cell(row) : fallbackCell(row, column.key)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-slate-500" colSpan={columns.length}>
                  {emptyState || "No records found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
