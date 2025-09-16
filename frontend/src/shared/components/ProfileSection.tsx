/*----------------------------------------------- 
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: ProfileSection.tsx
 *
 * Description:
 * Generic, data-driven profile display section for hubs.
 *
 * Responsibilities:
 * - Render avatar/initials, display name/company
 * - Show custom ID badge and role badge
 * - Show basic contact info (email/phone/website)
 *
 * Role in system:
 * - Shared UI used by role tabs (e.g., MyProfile)
 *
 * Notes:
 * - Keep strictly generic; no role-specific fields or labels
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React from 'react';

export interface ProfileUser {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  avatarUrl?: string;
}

export interface ProfileSectionProps {
  user?: ProfileUser;
  customId?: string;
  role?: string;
  // Config is passed for theming or future hooks; unused here to remain generic
  config?: unknown;
}

function initialsFrom(str?: string) {
  if (!str) return 'NA';
  const parts = str.trim().split(/\s+/);
  const letters = parts.map((p) => p[0]).join('').toUpperCase();
  return letters.slice(0, 2) || 'NA';
}

export default function ProfileSection({ user, customId, role, config }: ProfileSectionProps) {
  const displayName = user?.companyName || user?.name || 'Unnamed';
  const initials = initialsFrom(displayName);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
      {/* Avatar */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: '#6b7280',
            fontWeight: 700,
            margin: '0 auto 12px',
          }}
        >
          {initials}
        </div>
        <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{displayName}</div>
        <div style={{ marginTop: 8, display: 'inline-flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {customId ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                background: '#eef2ff',
                color: '#3730a3',
                fontSize: 12,
                border: '1px solid #e5e7eb',
              }}
            >
              {customId}
            </span>
          ) : null}
          {role ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                background: '#ecfeff',
                color: '#155e75',
                fontSize: 12,
                border: '1px solid #e5e7eb',
                textTransform: 'capitalize',
              }}
            >
              {role}
            </span>
          ) : null}
        </div>
      </div>

      {/* Contact & Details */}
      <div style={{ flex: 1 }}>
        <table style={{ width: '100%', borderSpacing: '0 12px' }}>
          <tbody>
            {user?.name && (
              <tr>
                <td style={cellLabel}>Name</td>
                <td style={cellValue}>{user.name}</td>
              </tr>
            )}
            {user?.companyName && (
              <tr>
                <td style={cellLabel}>Company</td>
                <td style={cellValue}>{user.companyName}</td>
              </tr>
            )}
            {customId && (
              <tr>
                <td style={cellLabel}>ID</td>
                <td style={cellValue}>{customId}</td>
              </tr>
            )}
            {user?.email && (
              <tr>
                <td style={cellLabel}>Email</td>
                <td style={cellValue}>{user.email}</td>
              </tr>
            )}
            {user?.phone && (
              <tr>
                <td style={cellLabel}>Phone</td>
                <td style={cellValue}>{user.phone}</td>
              </tr>
            )}
            {user?.website && (
              <tr>
                <td style={cellLabel}>Website</td>
                <td style={cellValue}>{user.website}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellLabel: React.CSSProperties = {
  fontSize: 14,
  color: '#111827',
  fontWeight: 600,
  width: 160,
  verticalAlign: 'top',
};

const cellValue: React.CSSProperties = {
  fontSize: 14,
  color: '#111827',
};

