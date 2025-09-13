import React, { useState } from 'react';

export default function Profile() {
  const [profileData, setProfileData] = useState({
    name: 'Freedom',
    email: 'admin@cks.com',
    role: 'System Administrator',
    userId: 'ADM-TEST-001',
    lastLogin: '2025-09-12 23:45:00',
    permissions: '33 loaded'
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 6 }}>
          Admin Profile
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>
          Manage your administrator profile and system access settings
        </p>
      </div>

      <div className="ui-card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          Profile Information
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Role
            </label>
            <input
              type="text"
              value={profileData.role}
              readOnly
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#6b7280',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              User ID
            </label>
            <input
              type="text"
              value={profileData.userId}
              readOnly
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#6b7280',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Save Changes
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}>
            Reset
          </button>
        </div>
      </div>

      <div className="ui-card" style={{ padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          System Access
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Last Login
            </label>
            <div style={{ color: '#111827', fontSize: 14 }}>
              {profileData.lastLogin}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', color: '#6b7280', fontSize: 14, marginBottom: 4 }}>
              Permissions
            </label>
            <div style={{ color: '#10b981', fontSize: 14 }}>
              {profileData.permissions}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
