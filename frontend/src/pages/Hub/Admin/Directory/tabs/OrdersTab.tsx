/**
 * File: OrdersTab.tsx
 *
 * Description:
 *   Split view of supply/product vs service/job orders.
 *
 * Functionality:
 *   Renders two AdminTable instances with filtered rows.
 *
 * Importance:
 *   Provides quick insight into orders by category within Directory.
 *
 * Connections:
 *   Used by DirectoryPage under the "orders" tab.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import AdminTable from '../../../../../components/AdminTable';

export default function OrdersTab({ rows, loading }: { rows: any[]; loading: boolean; }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      <div>
        <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Supply/Product Orders</div>
        <AdminTable
          columns={[
            { key: 'order_id', label: 'Order ID' },
            { key: 'center_id', label: 'Center ID' },
            { key: 'order_type', label: 'Type' },
            { key: 'created_at', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
          rows={(rows || []).filter((r: any) => (r.order_type ?? '').includes('supply'))}
          loading={loading}
          getKey={(r: any) => r.order_id}
        />
      </div>
      <div>
        <div style={{ fontWeight: 700, margin: '8px 0 8px' }}>Service/Job Orders</div>
        <AdminTable
          columns={[
            { key: 'order_id', label: 'Order ID' },
            { key: 'center_id', label: 'Center ID' },
            { key: 'service_id', label: 'Service ID' },
            { key: 'scheduled_date', label: 'Date' },
            { key: 'status', label: 'Status' },
          ]}
          rows={(rows || []).filter((r: any) => (r.order_type ?? '').includes('service'))}
          loading={loading}
          getKey={(r: any) => r.order_id}
        />
      </div>
    </div>
  );
}
