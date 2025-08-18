/**
 * File: SuppliesTab.tsx
 *
 * Description:
 *   Supplies list table wrapper for Admin Directory.
 *
 * Functionality:
 *   Renders AdminTable with provided columns/rows.
 *
 * Importance:
 *   Enables quick scan of supplies in Directory.
 *
 * Connections:
 *   Used by DirectoryPage with columns from its map.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import AdminTable from '../../../../../components/AdminTable';
import type { Column } from './_types';

export default function SuppliesTab({ columns, rows, loading }: { columns: Column[]; rows: any[]; loading: boolean; }) {
  return <AdminTable columns={columns} rows={rows} loading={loading} getKey={(r: any, i: number) => r.id || r.supply_code || i} />;
}
