/**
 * AdminTable.tsx
 *
 * Reusable table component for displaying entity lists in admin directory pages.
 * Accepts columns, rows, and an optional getKey function for row keys.
 */
import type { ReactNode } from "react";

type AdminTableColumn = {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
};

type AdminTableProps = {
  columns?: AdminTableColumn[];
  rows?: any[];
  getKey?: (row: any, idx: number) => string | number;
  loading?: boolean;
};

export default function AdminTable({ columns = [], rows = [], getKey, loading = false }: AdminTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left font-semibold border-b border-gray-200">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(5, 1 + Math.floor((typeof rows?.length === 'number' ? rows.length : 10)/2)) }).map((_, i) => (
                <tr key={`sk_${i}`} className="border-t border-gray-100">
                  {columns.map((c) => (
                    <td key={c.key}>
                      <div className="h-3 w-3/5 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6 text-ink-500">No data.</td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr key={getKey ? getKey(r, idx) : idx} className="border-t border-gray-100">
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(r[c.key], r) : (r[c.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
