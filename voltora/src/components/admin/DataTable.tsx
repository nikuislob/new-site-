import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found.",
  loading,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#1e2d45] bg-[#121a2b] py-16 text-sm text-[#8b9cb8]">
        Loading…
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-[#1e2d45] bg-[#121a2b] py-16 text-sm text-[#8b9cb8]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-[#1e2d45] bg-[#121a2b]", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#1e2d45] text-xs uppercase tracking-wide text-[#8b9cb8]">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-3 font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1e2d45]">
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="text-[#e8edf5] transition-colors hover:bg-[#182338]/60">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 align-middle", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
