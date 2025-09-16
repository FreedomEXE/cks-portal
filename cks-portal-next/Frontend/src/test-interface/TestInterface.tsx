/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: TestInterface.tsx
 *
 * Description:
 * Test interface that directly renders the actual hub components
 * with full debug tools and component tracking
 *
 * Responsibilities:
 * - Allow switching between all 7 role hubs
 * - Render actual hub components without duplication
 * - Provide comprehensive debug information
 * - Track component usage and locations
 *
 * Role in system:
 * - Development testing interface with full debugging
 *
 * Notes:
 * No code duplication - uses actual hub components
 */
/*───────────────────────────────────────────────
  Manifested by Freedom_EXE
───────────────────────────────────────────────*/

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { useComponentDiscovery } from './hooks/useComponentDiscovery';

// Dynamically import hub components
const hubs = {
  admin: lazy(() => import('../hubs/AdminHub')),
  manager: lazy(() => import('../hubs/ManagerHub')),
  contractor: lazy(() => import('../hubs/ContractorHub')),
  customer: lazy(() => import('../hubs/CustomerHub')),
  center: lazy(() => import('../hubs/CenterHub')),
  crew: lazy(() => import('../hubs/CrewHub')),
  warehouse: lazy(() => import('../hubs/WarehouseHub')),
};

type RoleType = keyof typeof hubs;
type ViewMode = 'hub' | 'catalog' | 'config';

export default function TestInterface() {
  const [selectedRole, setSelectedRole] = useState<RoleType>('manager');
  const [viewMode, setViewMode] = useState<ViewMode>('hub');
  const [showDebug, setShowDebug] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const HubComponent = hubs[selectedRole];

  // Use dynamic component discovery
  const { components: loadedComponents, componentCount } = useComponentDiscovery(selectedRole);

  const roleInfo = {
    admin: {
      color: '#111827',
      accent: '#374151',
      label: 'Administrator',
      description: 'Full system administration access',
      permissions: 33,
      tabs: 6
    },
    manager: {
      color: '#3b82f6',
      accent: '#60a5fa',
      label: 'Manager',
      description: 'Service and operations management',
      permissions: 9,
      tabs: 7
    },
    contractor: {
      color: '#10b981',
      accent: '#34d399',
      label: 'Contractor',
      description: 'Premium contractor services',
      permissions: 8,
      tabs: 7
    },
    customer: {
      color: '#eab308',
      accent: '#facc15',
      label: 'Customer',
      description: 'Service requests and management',
      permissions: 9,
      tabs: 7
    },
    center: {
      color: '#f97316',
      accent: '#fb923c',
      label: 'Center',
      description: 'Facility and operations management',
      permissions: 10,
      tabs: 7
    },
    crew: {
      color: '#ef4444',
      accent: '#f87171',
      label: 'Crew',
      description: 'Task and schedule management',
      permissions: 10,
      tabs: 7
    },
    warehouse: {
      color: '#8b5cf6',
      accent: '#a78bfa',
      label: 'Warehouse',
      description: 'Inventory and order processing',
      permissions: 8,
      tabs: 7
    },
  };

  const renderComponentCatalog = () => {
    // Group components by type
    const uiComponents = loadedComponents.filter(c => c.type === 'ui');
    const domainComponents = loadedComponents.filter(c => c.type === 'domain');
    const featureComponents = loadedComponents.filter(c => c.type === 'feature');
    const hubComponents = loadedComponents.filter(c => c.type === 'hub');

    return (
      <div style={{ padding: '2rem', background: '#1e293b', minHeight: '100%' }}>
        <h2 style={{ color: '#f8fafc', marginBottom: '1.5rem' }}>📦 Component Catalog</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <h3 style={{ color: '#60a5fa', margin: '0 0 0.5rem 0' }}>packages/ui/ ({uiComponents.length})</h3>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {uiComponents.map(comp => (
                <div key={comp.name}>✅ {comp.name}</div>
              ))}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <h3 style={{ color: '#10b981', margin: '0 0 0.5rem 0' }}>packages/domain-widgets/ ({domainComponents.length})</h3>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {domainComponents.map(comp => (
                <div key={comp.name}>✅ {comp.name}</div>
              ))}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <h3 style={{ color: '#f97316', margin: '0 0 0.5rem 0' }}>src/features/ ({featureComponents.length})</h3>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {featureComponents.length > 0 ? (
                featureComponents.map(comp => (
                  <div key={comp.name}>✅ {comp.name}</div>
                ))
              ) : (
                <div>⏳ No features loaded</div>
              )}
            </div>
          </div>

          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #334155' }}>
            <h3 style={{ color: '#8b5cf6', margin: '0 0 0.5rem 0' }}>src/hubs/</h3>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              {Object.keys(hubs).map(hub => (
                <div key={hub}>
                  {selectedRole === hub ? '✅' : '○'} {hub.charAt(0).toUpperCase() + hub.slice(1)}Hub
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConfigDetails = () => (
    <div style={{ padding: '2rem', background: '#1e293b', minHeight: '100%' }}>
      <h2 style={{ color: '#f8fafc', marginBottom: '1.5rem' }}>⚙️ {roleInfo[selectedRole].label} Configuration</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem' }}>
          <h3 style={{ color: roleInfo[selectedRole].color, margin: '0 0 1rem 0' }}>Role Details</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>
            <div><strong>Role:</strong> {selectedRole}</div>
            <div><strong>Display Name:</strong> {roleInfo[selectedRole].label}</div>
            <div><strong>Description:</strong> {roleInfo[selectedRole].description}</div>
            <div><strong>Primary Color:</strong> {roleInfo[selectedRole].color}</div>
            <div><strong>Accent Color:</strong> {roleInfo[selectedRole].accent}</div>
            <div><strong>Permissions:</strong> {roleInfo[selectedRole].permissions}</div>
            <div><strong>Tabs:</strong> {roleInfo[selectedRole].tabs}</div>
          </div>
        </div>

        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '0.5rem' }}>
          <h3 style={{ color: roleInfo[selectedRole].color, margin: '0 0 1rem 0' }}>Component Locations ({loadedComponents.length})</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6, fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto' }}>
            {loadedComponents.map(comp => (
              <div key={comp.name} style={{ marginBottom: '0.25rem' }}>
                <strong style={{ color: comp.type === 'ui' ? '#60a5fa' : comp.type === 'domain' ? '#10b981' : comp.type === 'hub' ? '#8b5cf6' : '#f97316' }}>
                  {comp.name}:
                </strong> {comp.location}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
      {/* Header with Role Switcher */}
      <div style={{
        background: '#1e293b',
        padding: '1rem',
        borderBottom: `2px solid ${roleInfo[selectedRole].color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0
      }}>
        <div style={{ color: '#f9fafb', fontWeight: 'bold', fontSize: '1.125rem' }}>
          CKS Test Interface - New Structure
        </div>

        {/* Role Switcher */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
          {Object.entries(roleInfo).map(([role, info]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role as RoleType)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: selectedRole === role ? info.color : '#475569',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: selectedRole === role ? '600' : '400',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== role) {
                  e.currentTarget.style.backgroundColor = '#64748b';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== role) {
                  e.currentTarget.style.backgroundColor = '#475569';
                }
              }}
            >
              {info.label}
            </button>
          ))}
        </div>

        {/* View Mode Toggles */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('hub')}
            style={{
              padding: '0.5rem 1rem',
              border: viewMode === 'hub' ? `1px solid ${roleInfo[selectedRole].color}` : '1px solid #374151',
              borderRadius: '0.375rem',
              backgroundColor: viewMode === 'hub' ? '#374151' : 'transparent',
              color: viewMode === 'hub' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            🏠 Hub View
          </button>
          <button
            onClick={() => setViewMode('catalog')}
            style={{
              padding: '0.5rem 1rem',
              border: viewMode === 'catalog' ? `1px solid ${roleInfo[selectedRole].color}` : '1px solid #374151',
              borderRadius: '0.375rem',
              backgroundColor: viewMode === 'catalog' ? '#374151' : 'transparent',
              color: viewMode === 'catalog' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            📦 Catalog
          </button>
          <button
            onClick={() => setViewMode('config')}
            style={{
              padding: '0.5rem 1rem',
              border: viewMode === 'config' ? `1px solid ${roleInfo[selectedRole].color}` : '1px solid #374151',
              borderRadius: '0.375rem',
              backgroundColor: viewMode === 'config' ? '#374151' : 'transparent',
              color: viewMode === 'config' ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            ⚙️ Config
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #374151',
              borderRadius: '0.375rem',
              backgroundColor: showDebug ? '#059669' : 'transparent',
              color: showDebug ? '#f8fafc' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            🐛 Debug
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div style={{
          background: '#111827',
          padding: '1rem',
          borderBottom: '1px solid #374151',
          color: '#94a3b8',
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <strong style={{ color: '#60a5fa' }}>Active Role:</strong> {selectedRole}
              <br />
              <strong style={{ color: '#60a5fa' }}>Hub Component:</strong> {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}Hub
            </div>
            <div>
              <strong style={{ color: '#10b981' }}>Components Loaded:</strong> {componentCount}
              <br />
              <strong style={{ color: '#10b981' }}>View Mode:</strong> {viewMode}
            </div>
            <div>
              <strong style={{ color: '#f97316' }}>Test Port:</strong> {window.location.port}
              <br />
              <strong style={{ color: '#f97316' }}>Environment:</strong> Development
            </div>
            <div>
              <strong style={{ color: '#8b5cf6' }}>MyHubSection:</strong> ✅ Loaded
              <br />
              <strong style={{ color: '#8b5cf6' }}>Role Config:</strong> {roleInfo[selectedRole].tabs} tabs
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
        {viewMode === 'catalog' ? (
          renderComponentCatalog()
        ) : viewMode === 'config' ? (
          renderConfigDetails()
        ) : (
          <div style={{ height: '100%', background: '#f9fafb' }}>
            <Suspense fallback={
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f9fafb'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: roleInfo[selectedRole].color }}>
                    Loading {roleInfo[selectedRole].label} Hub...
                  </div>
                  <div style={{ color: '#6b7280' }}>Importing components...</div>
                </div>
              </div>
            }>
              <HubComponent />
            </Suspense>
          </div>
        )}
      </div>

      {/* Footer Status Bar */}
      <div style={{
        background: '#111827',
        padding: '0.75rem 1rem',
        borderTop: `1px solid ${roleInfo[selectedRole].color}`,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <span>
            <strong style={{ color: '#94a3b8' }}>Role:</strong> {selectedRole} ({roleInfo[selectedRole].label})
          </span>
          <span>
            <strong style={{ color: '#94a3b8' }}>Permissions:</strong> {roleInfo[selectedRole].permissions} loaded
          </span>
          <span>
            <strong style={{ color: '#94a3b8' }}>Tabs:</strong> {roleInfo[selectedRole].tabs} available
          </span>
          <span>
            <strong style={{ color: '#94a3b8' }}>Components:</strong> {componentCount} in use
          </span>
        </div>
        <div>
          <span style={{ color: '#10b981' }}>● </span>
          CKS Portal Next v2.0.0 | Port {window.location.port}
        </div>
      </div>
    </div>
  );
}