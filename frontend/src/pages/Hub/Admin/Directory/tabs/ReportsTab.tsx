/**
 * File: ReportsTab.tsx
 *
 * Description:
 *   Split view of center vs manager reports.
 *
 * Functionality:
 *   Renders two AdminTable instances with filtered rows.
 *
 * Importance:
 *   Provides quick insight into reports by source within Directory.
 *
 * Connections:
 *   Used by DirectoryPage under the "reports" tab.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import AdminTable from '../../../../../components/AdminTable';

export default function ReportsTab({ rows, loading }: { rows: any[]; loading: boolean; }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Center Reports</div>
        <AdminTable
          columns={[
            { key: 'report_id', label: 'Report ID' },
            { key: 'center_id', label: 'Center ID' },
            { key: 'type', label: 'Type' },
            { key: 'submitted_date', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
          rows={(rows || []).filter((r: any) => (r.source ?? '').includes('center'))}
          loading={loading}
          getKey={(r: any) => r.report_id}
        />
      </div>
      <div>
        <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Manager Reports</div>
        <AdminTable
          columns={[
            { key: 'report_id', label: 'Report ID' },
            { key: 'manager_id', label: 'Manager ID' },
            { key: 'type', label: 'Type' },
            { key: 'submitted_date', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
          rows={(rows || []).filter((r: any) => (r.source ?? '').includes('manager'))}
          loading={loading}
          getKey={(r: any) => r.report_id}
        />
      </div>
    </div>
  );
}
