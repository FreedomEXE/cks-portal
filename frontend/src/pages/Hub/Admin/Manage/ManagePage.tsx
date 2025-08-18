/**
 * File: ManagePage.tsx
 *
 * Description:
 *   Admin Manage hub page listing entity-specific manage links.
 *
 * Functionality:
 *   Displays a grid of hub-scoped manage links (crew, manager, etc.).
 *
 * Importance:
 *   Launch point for Admin management workflows.
 *
 * Connections:
 *   Uses Page shell and HubLink helper.
 */

/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import Page from '../../../../components/Page';
import { useParams } from 'react-router-dom';
import HubLink from '../../../../components/ui/HubLink';

const manages = [
  { key: 'crew', label: 'Manage Crew' },
  { key: 'manager', label: 'Manage Managers' },
  { key: 'contractor', label: 'Manage Contractors' },
  { key: 'customer', label: 'Manage Customers' },
  { key: 'center', label: 'Manage Centers' },
  { key: 'service', label: 'Manage Services' },
  { key: 'job', label: 'Manage Jobs' },
  { key: 'supply', label: 'Manage Supplies' },
  { key: 'procedure', label: 'Manage Procedures' },
  { key: 'training', label: 'Manage Training' },
  { key: 'warehouse', label: 'Manage Warehouses' },
] as const;

export default function ManagePage() {
  const params = useParams();
  const role = (params.username as string) || (typeof window !== 'undefined' ? (sessionStorage.getItem('role')||'admin') : 'admin');
  return (
    <Page title="Manage">
      <p style={{ marginBottom: 16 }}>Choose what you want to manage:</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 12 }}>
        {manages.map((m) => (
          <HubLink key={m.key} hub={role} sub={`manage/${m.key}`} className="hub-card ui-card">
            <div className="title">{m.label}</div>
          </HubLink>
        ))}
      </div>
    </Page>
  );
}
