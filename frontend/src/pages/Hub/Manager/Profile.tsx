/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Profile.tsx (Manager Profile - ZERO IMPORTS except data)
 * 
 * Description: Manager profile with Page styling hardcoded
 * Function: Complete self-contained profile with header matching Page component
 * Importance: Critical - True hub independence 
 * Connects to: useMeProfile only
 * 
 * Notes: All Page component styling copied inline.
 *        100% self-contained - no external dependencies.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useMeProfile from '../../../hooks/useMeProfile';

export default function ManagerProfile() {
  const state = useMeProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Hardcoded tab structure for Manager
  const tabs = [
    { 
      label: 'Profile',
      columns: [
        { key: 'full-name', label: 'Full Name' },
        { key: 'reports-to', label: 'Reports To' },
        { key: 'manager-id', label: 'Manager ID' },
        { key: 'role', label: 'Role' },
        { key: 'start-date', label: 'Start Date' },
        { key: 'years-with-company', label: 'Years with Company' },
        { key: 'primary-region', label: 'Primary Region' },
        { key: 'email', label: 'Email' },
        { key: 'languages', label: 'Languages' },
        { key: 'phone', label: 'Phone' },
        { key: 'emergency-contact', label: 'Emergency Contact' },
        { key: 'home-address', label: 'Home Address' },
        { key: 'linkedin', label: 'LinkedIn' },
        { key: 'status', label: 'Status' },
        { key: 'availability', label: 'Availability' },
        { key: 'preferred-areas', label: 'Preferred Areas' },
        { key: 'qr-code', label: 'QR Code' },
        { key: 'synced', label: 'Synced with Portal' }
      ]
    },
    { 
      label: 'Centers',
      columns: [
        { key: 'center-id', label: 'Center ID' },
        { key: 'center-name', label: 'Center Name' },
        { key: 'role', label: 'Role' },
        { key: 'procedures', label: 'Procedures' },
        { key: 'assigned-since', label: 'Assigned Since' },
        { key: 'status', label: 'Status' }
      ]
    },
    {
      label: 'Crew',
      columns: [
        { key: 'crew-id', label: 'Crew ID' },
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'start-date', label: 'Start Date' },
        { key: 'shift', label: 'Shift' },
        { key: 'duties', label: 'Duties' },
        { key: 'custom-procedure', label: 'Custom Procedure' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'notes', label: 'Notes' }
      ]
    },
    {
      label: 'Services',
      columns: [
        { key: 'service-id', label: 'Service ID' },
        { key: 'service-name', label: 'Service Name' },
        { key: 'experience', label: 'Experience (Years)' },
        { key: 'proficiency', label: 'Proficiency' },
        { key: 'certifications', label: 'Certifications' }
      ]
    },
    {
      label: 'Jobs',
      columns: [
        { key: 'job-id', label: 'Job ID' },
        { key: 'service-name', label: 'Service Name' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'notes', label: 'Notes' }
      ]
    },
    {
      label: 'Training',
      columns: [
        { key: 'training-id', label: 'Training ID' },
        { key: 'service', label: 'Service' },
        { key: 'date-completed', label: 'Date Completed' },
        { key: 'last-refresher', label: 'Last Refresher' },
        { key: 'expires-on', label: 'Expires On' },
        { key: 'type', label: 'Type' },
        { key: 'days-to-complete', label: 'Days to Complete' },
        { key: 'status', label: 'Status' }
      ]
    },
    {
      label: 'Performance',
      columns: [
        { key: 'performance-id', label: 'Performance ID' },
        { key: 'reviewed-by', label: 'Reviewed By' },
        { key: 'year', label: 'Year' },
        { key: 'reliability-score', label: 'Reliability Score (%)' },
        { key: 'avg-rating', label: 'Avg Rating' },
        { key: 'feedback-incidents', label: 'Feedback Incidents' },
        { key: 'notes', label: 'Notes' }
      ]
    },
    {
      label: 'Supplies/Equipment',
      columns: [
        { key: 'item', label: 'Item' },
        { key: 'issued', label: 'Issued' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status' },
        { key: 'condition', label: 'Condition' },
        { key: 'notes', label: 'Notes' }
      ]
    }
  ];

  const data = state.data || {};
  
  // Helper to get value from data with multiple key formats
  const getValue = (key: string) => {
    if (data[key] !== undefined) return data[key];
    const underscoreKey = key.replace(/-/g, '_');
    if (data[underscoreKey] !== undefined) return data[underscoreKey];
    const camelKey = underscoreKey.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    if (data[camelKey] !== undefined) return data[camelKey];
    return '—';
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = data.full_name || data.name || 'Manager';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'MG';
  };

  const currentTab = tabs[activeTab];

  // Icon button style from Page component
  const iconBtnStyle = {
    width: 38,
    height: 38,
    borderRadius: 999,
    padding: 0,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    border: '1px solid #e5e7eb',
    background: 'white',
    cursor: 'pointer'
  };

  // Loading state
  if (state.loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Page-style header */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #3b7af7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                onClick={() => window.location.href = '/hub'}
                className="ui-button"
                aria-label="Home"
                title="Home"
                style={iconBtnStyle}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 10v10h14V10" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </button>
              <button
                className="ui-button"
                aria-label="Back"
                title="Back"
                style={iconBtnStyle}
                onClick={() => navigate(-1)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                </svg>
              </button>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              My Profile
            </h1>
          </div>
        </div>
        <div style={{ animation: 'fadeIn .12s ease-out' }}>
          <div style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
            Loading profile data...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Page-style header */}
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '24px 0 12px',
          gap: 12,
          padding: 12,
          borderTop: '4px solid #3b7af7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                onClick={() => window.location.href = '/hub'}
                className="ui-button"
                aria-label="Home"
                title="Home"
                style={iconBtnStyle}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 10v10h14V10" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </button>
              <button
                className="ui-button"
                aria-label="Back"
                title="Back"
                style={iconBtnStyle}
                onClick={() => navigate(-1)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                </svg>
              </button>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
              My Profile
            </h1>
          </div>
        </div>
        <div style={{ animation: 'fadeIn .12s ease-out' }}>
          <div style={{ padding: 16, background: '#fef2f2', color: '#b91c1c', borderRadius: 12 }}>
            Error loading profile: {state.error}
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page-style header with home/back buttons */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '24px 0 12px',
        gap: 12,
        padding: 12,
        borderTop: '4px solid #3b7af7'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              onClick={() => window.location.href = '/hub'}
              className="ui-button"
              aria-label="Home"
              title="Home"
              style={iconBtnStyle}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 10v10h14V10" />
                <path d="M9 21V12h6v9" />
              </svg>
            </button>
            <button
              className="ui-button"
              aria-label="Back"
              title="Back"
              style={iconBtnStyle}
              onClick={() => navigate(-1)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
                <line x1="9" y1="12" x2="21" y2="12" />
              </svg>
            </button>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: 0.3, margin: 0 }}>
            My Profile
          </h1>
        </div>
      </div>

      {/* Main content with animation */}
      <div style={{ animation: 'fadeIn .12s ease-out' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: i === activeTab ? '#111827' : 'white',
                color: i === activeTab ? 'white' : '#111827',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {currentTab.label === 'Profile' ? (
          // Profile tab with photo and fields
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) 1fr', gap: 16 }}>
            {/* Left: Photo/Graphics */}
            <div className="ui-card" style={{
              padding: 16,
              alignSelf: 'start'
            }}>
              <div className="title" style={{ marginBottom: 12 }}>
                Photo / Graphics
              </div>
              <div style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 72,
                fontWeight: 700,
                color: '#6b7280',
                margin: '0 auto'
              }}>
                {getInitials()}
              </div>
              <button style={{
                marginTop: 12,
                width: '100%',
                padding: '8px 16px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14
              }}>
                Change
              </button>
            </div>

            {/* Right: Field / Value table */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: 12, 
              overflow: 'hidden',
              background: 'white'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: '#111827', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      Field
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px 16px', 
                      fontWeight: 600, 
                      fontSize: 14, 
                      color: '#111827', 
                      borderBottom: '1px solid #e5e7eb' 
                    }}>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTab.columns.map((column, i) => (
                    <tr key={column.key} style={{ borderTop: i > 0 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ 
                        padding: '10px 16px', 
                        width: '34%', 
                        fontWeight: 600, 
                        color: '#111827',
                        fontSize: 14
                      }}>
                        {column.label}
                      </td>
                      <td style={{ 
                        padding: '10px 16px', 
                        color: '#111827',
                        fontSize: 14
                      }}>
                        {String(getValue(column.key))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Other tabs - placeholder table
          <div style={{ 
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'white'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  {currentTab.columns.map(col => (
                    <th key={col.key} style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#111827',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={currentTab.columns.length} style={{
                    padding: 24,
                    textAlign: 'center',
                    color: '#6b7280'
                  }}>
                    No {currentTab.label.toLowerCase()} data available yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style>{`@keyframes fadeIn{from{opacity:0; transform:translateY(2px)} to{opacity:1; transform:none}}`}</style>
    </div>
  );
}