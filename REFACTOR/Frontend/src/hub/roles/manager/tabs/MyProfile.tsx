/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * MyProfile.tsx
 * 
 * Description: Manager profile management with personal info and settings tabs
 * Function: View/edit manager profile data and preferences
 * Importance: Critical - Allows managers to manage personal information and settings
 * Connects to: Manager API profile endpoints, useManagerData hook
 * 
 * Notes: Extracted from legacy Home.tsx profile section.
 *        Maintains exact styling and functionality including tabs,
 *        profile display, and settings management.
 */

import React, { useState } from 'react';
import useManagerData from '../hooks/useManagerData';

interface MyProfileProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

export default function MyProfile({ userId, config, features, api }: MyProfileProps) {
  const state = useManagerData();
  const [profileTab, setProfileTab] = useState(0);

  // Extract manager code and name from profile data
  const code = userId;
  const name = state.data?.name || 'Manager Demo';

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Manager Profile</h2>
      
      {/* Profile Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['Profile', 'Settings'].map((tab, i) => (
          <button
            key={tab}
            onClick={() => setProfileTab(i)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: profileTab === i ? '#3b7af7' : 'white',
              color: profileTab === i ? 'white' : '#111827',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Content */}
      <div className="ui-card" style={{ padding: 16 }}>
        {profileTab === 0 && (
          <div style={{ display: 'flex', gap: 32 }}>
            {/* Profile Photo - Left Side */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                color: '#6b7280',
                fontWeight: 'bold',
                marginBottom: 16
              }}>
                {name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'MD'}
              </div>
              <button style={{
                padding: '8px 16px',
                background: 'white',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}>
                Update Photo
              </button>
            </div>

            {/* Profile Info Grid - Right Side */}
            <div style={{ flex: 1 }}>
              <table style={{ width: '100%', borderSpacing: '0 16px' }}>
                <tbody>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, width: '200px', verticalAlign: 'top' }}>
                      Full Name
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.name || 'Manager Demo'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Manager ID
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.manager_id || code}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Territory
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.territory || 'Demo Territory'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Reports To
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.reports_to || 'Senior Manager'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Email
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.email || 'manager@demo.com'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Phone
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.phone || '(555) 123-4567'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Start Date
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {(() => {
                        try {
                          if (!state.data?.start_date) return '—';
                          const dt = new Date(state.data.start_date);
                          if (isNaN(dt.getTime())) return String(state.data.start_date);
                          return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
                        } catch { return String(state.data?.start_date || '—'); }
                      })()}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontSize: 16, color: '#111827', fontWeight: 500, verticalAlign: 'top' }}>
                      Role
                    </td>
                    <td style={{ fontSize: 16, color: '#111827' }}>
                      {state.data?.role || 'Territory Manager'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {profileTab === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Manager Settings</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Notification Settings */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Notifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" defaultChecked />
                    Email notifications for new assignments
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" defaultChecked />
                    SMS alerts for urgent issues
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" />
                    Weekly performance reports
                  </label>
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Display</h4>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#6b7280' }}>Dashboard Refresh Rate</label>
                    <select style={{ width: '200px', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}>
                      <option value="30">30 seconds</option>
                      <option value="60" selected>1 minute</option>
                      <option value="300">5 minutes</option>
                      <option value="600">10 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6b7280' }}>Time Zone</label>
                    <select style={{ width: '200px', padding: 8, border: '1px solid #e5e7eb', borderRadius: 6, marginTop: 4 }}>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ marginTop: 16 }}>
                <button style={{ 
                  padding: '8px 16px', 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 6, 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
