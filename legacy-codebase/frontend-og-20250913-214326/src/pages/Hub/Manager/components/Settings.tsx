/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react';

export default function Settings() {
  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid #222',
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Settings</div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>
        Manage your account and security preferences.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a href="/account#security" style={{
          padding: '8px 12px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          fontSize: 13,
          textDecoration: 'none'
        }}>Change Password</a>
      </div>
    </div>
  );
}

