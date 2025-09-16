/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: AccountManagerPanel.tsx
 *
 * Description:
 * Shared Account Manager information panel used by multiple roles.
 *
 * Responsibilities:
 * - Render manager avatar/initials and identity
 * - Show contact and assignment details
 *
 * Role in system:
 * - Dropped into MyProfile sub-tab "Account Manager" across roles
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react';

export interface ManagerProfile {
  manager_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  territory?: string;
  role?: string;
  avatarUrl?: string;
}

export interface AccountManagerPanelProps {
  manager: ManagerProfile | null;
  title?: string;
  showTerritory?: boolean;
  onContact?: () => void;
  onSchedule?: () => void;
}

function initialsFrom(name?: string) {
  if (!name) return 'NM';
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2) || 'NM';
}

export default function AccountManagerPanel({ manager, title = 'CKS Account Manager', showTerritory = false, onContact, onSchedule }: AccountManagerPanelProps) {
  if (!manager) return null;

  return (
    <div>
      {/* Section title (inside inner card) */}
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#10b981' }}>{title}</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
      {/* Manager Photo */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: '#2563eb',
            fontWeight: 700,
            margin: '0 auto 12px',
          }}
        >
          {initialsFrom(manager.name)}
        </div>
        <div style={{ fontSize: 14, color: '#111827', fontWeight: 600, marginTop: 8 }}>{manager.name || 'Assigned Manager'}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{manager.role || 'Account Manager'}</div>
      </div>

      {/* Details */}
      <div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={rowLabel}>Manager Name</td>
              <td style={rowValue}>{manager.name || 'Not Available'}</td>
            </tr>
            <tr>
              <td style={rowLabel}>Manager ID</td>
              <td style={rowValue}>{manager.manager_id || 'Not Available'}</td>
            </tr>
            <tr>
              <td style={rowLabel}>Email</td>
              <td style={rowValue}>{manager.email || 'Not Available'}</td>
            </tr>
            <tr>
              <td style={rowLabel}>Phone</td>
              <td style={rowValue}>{manager.phone || 'Not Available'}</td>
            </tr>
            {showTerritory && (
              <tr>
                <td style={rowLabel}>Territory</td>
                <td style={rowValue}>{manager.territory || 'Not Available'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Actions */}
        <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
          <button
            onClick={onContact}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Contact Manager
          </button>
          <button
            onClick={onSchedule}
            style={{
              padding: '8px 16px',
              background: 'white',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Schedule Meeting
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

const rowLabel: React.CSSProperties = {
  padding: '12px 0',
  fontWeight: 600,
  width: '40%',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6',
};

const rowValue: React.CSSProperties = {
  padding: '12px 0',
  color: '#6b7280',
  borderBottom: '1px solid #f3f4f6',
};
