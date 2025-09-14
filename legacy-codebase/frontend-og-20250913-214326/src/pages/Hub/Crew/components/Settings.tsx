/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function Settings() {
  return (
    <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 12, padding: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#7f1d1d' }}>Settings</div>
      <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 12 }}>
        Manage your account and security preferences.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/account#security" style={{
          padding: '8px 12px',
          background: '#ef4444',
          color: '#fff',
          borderRadius: 8,
          fontSize: 13,
          textDecoration: 'none'
        }}>Change Password</a>
      </div>
    </div>
  );
}

