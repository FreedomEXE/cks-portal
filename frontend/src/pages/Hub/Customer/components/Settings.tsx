/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function Settings() {
  return (
    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#7c2d12' }}>Settings</div>
      <div style={{ fontSize: 13, color: '#9a3412', marginBottom: 12 }}>
        Manage your account and security preferences.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/account#security" style={{
          padding: '8px 12px',
          background: '#f59e0b',
          color: '#111827',
          borderRadius: 8,
          fontSize: 13,
          textDecoration: 'none'
        }}>Change Password</a>
      </div>
    </div>
  );
}

