/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: HubTester.tsx
 *
 * Description:
 * Main test interface component for role hub testing
 *
 * Responsibilities:
 * - Provide role switching interface
 * - Display role information and permissions
 * - Load role configurations from generated configs
 * - Test individual components as they're developed
 *
 * Role in system:
 * - Main component for test interface sandbox
 * - Enables comprehensive testing of all role hubs
 *
 * Notes:
 * Based on legacy test-hub-roles.tsx adapted for new modular structure
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { useState, useEffect } from 'react';
import RoleHub from './hub/RoleHub';
import { CatalogProvider } from './catalog/CatalogContext';
import CatalogViewer from './catalog/CatalogViewer';
import {
  testUsers,
  loadRoleConfig,
  validateRoleComponents,
  type TestRole,
  type TestUserData,
  type RoleConfig
} from './hub/roleConfigLoader';

export default function HubTester() {
  const [selectedRole, setSelectedRole] = useState<TestRole>('manager');
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [componentValidation, setComponentValidation] = useState<any[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [showConfigDetails, setShowConfigDetails] = useState<boolean>(false);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const currentUser = testUsers[selectedRole];

  // Load role configuration when role changes
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await loadRoleConfig(selectedRole);
        const validation = await validateRoleComponents(selectedRole);

        setRoleConfig(config);
        setComponentValidation(validation);
      } catch (error) {
        console.error(`[HubTester] Error loading config for ${selectedRole}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [selectedRole]);

  const handleRoleChange = async (role: TestRole) => {
    setSelectedRole(role);
    console.group(`🔄 Switching to ${role} role`);
    console.log('User data:', testUsers[role]);
    console.groupEnd();
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a'
    }}>
      {/* Header with Role Selector */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '1rem',
        borderBottom: '2px solid #475569',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Title */}
        <div style={{
          color: '#f8fafc',
          fontWeight: 'bold',
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🧪 CKS Test Interface
          <span style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            background: '#1e293b',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontWeight: 'normal',
            fontFamily: 'monospace'
          }}>
            v2.0.0-next
          </span>
        </div>

        {/* Role Selector Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {Object.entries(testUsers).map(([role, userData]) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role as TestRole)}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: selectedRole === role ? '#3b82f6' : '#475569',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1,
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== role && !loading) {
                  e.currentTarget.style.backgroundColor = '#64748b';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== role && !loading) {
                  e.currentTarget.style.backgroundColor = '#475569';
                }
              }}
            >
              {userData.displayName.replace(' Hub Test', '')}
              {loading && selectedRole === role && (
                <div style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '12px',
                  height: '12px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Debug Toggle */}
        <button
          onClick={() => setShowDebugInfo(prev => !prev)}
          style={{
            padding: '0.5rem',
            border: '1px solid #64748b',
            borderRadius: '0.375rem',
            backgroundColor: showDebugInfo ? '#059669' : '#1e293b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title="Toggle debug information"
        >
          🐛
        </button>

        {/* Config Toggle */}
        <button
          onClick={() => setShowConfigDetails(prev => !prev)}
          style={{
            padding: '0.5rem',
            border: '1px solid #64748b',
            borderRadius: '0.375rem',
            backgroundColor: showConfigDetails ? '#7c3aed' : '#1e293b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title="Toggle configuration details"
        >
          ⚙️
        </button>

        {/* Catalog Toggle */}
        <button
          onClick={() => setShowCatalog(prev => !prev)}
          style={{
            padding: '0.5rem',
            border: '1px solid #64748b',
            borderRadius: '0.375rem',
            backgroundColor: showCatalog ? '#059669' : '#1e293b',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
          title="Toggle component catalog"
        >
          📦
        </button>
      </div>

      {/* Debug/Config Info Panel */}
      {(showDebugInfo || showConfigDetails) && (
        <div style={{
          background: '#1e293b',
          borderBottom: '1px solid #475569',
          padding: '1rem',
          fontSize: '0.875rem',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {showDebugInfo && (
            <div style={{ marginBottom: showConfigDetails ? '1rem' : 0 }}>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                🐛 Debug Information
              </h3>
              <div style={{ color: '#cbd5e1', display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                <div>
                  <strong>Role:</strong> {currentUser.role}<br />
                  <strong>User ID:</strong> {currentUser.id}<br />
                  <strong>Permissions:</strong> {currentUser.permissions.length}
                </div>
                <div>
                  <strong>Component Validation:</strong><br />
                  {componentValidation.map((result, i) => (
                    <span key={i} style={{
                      display: 'inline-block',
                      margin: '2px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      borderRadius: '0.25rem',
                      background: result.status === 'OK' ? '#059669' : '#dc2626',
                      color: 'white'
                    }}>
                      {result.component}: {result.status}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showConfigDetails && roleConfig && (
            <div>
              <h3 style={{ color: '#f1f5f9', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                ⚙️ Role Configuration
              </h3>
              <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Tabs:</strong> {roleConfig.tabs.map(tab => tab.label).join(', ')}
                </div>
                <div>
                  <strong>Features:</strong> {Object.keys(roleConfig.features).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <CatalogProvider>
          {showCatalog ? (
            <CatalogViewer />
          ) : (
            <>
              <RoleHub
                userId={currentUser.id}
                role={currentUser.role}
                userPermissions={currentUser.permissions}
                className={`${currentUser.role}-hub-test`}
              />

              {/* Test Shared Components Section */}
              <div style={{
                background: '#1e293b',
                margin: '1rem',
                borderRadius: '0.5rem',
                border: '2px dashed #475569'
              }}>
                <div style={{
                  background: '#334155',
                  padding: '1rem',
                  borderTopLeftRadius: '0.5rem',
                  borderTopRightRadius: '0.5rem',
                  borderBottom: '1px solid #475569'
                }}>
                  <h3 style={{ color: '#f1f5f9', margin: 0, fontSize: '1rem' }}>
                    🧪 Shared Components Test
                  </h3>
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ color: '#9ca3af' }}>Shared components will appear here when created</p>
                </div>
              </div>
            </>
          )}
        </CatalogProvider>
      </div>

      {/* Status Footer */}
      <div style={{
        background: '#111827',
        padding: '0.75rem',
        borderTop: '1px solid #374151',
        color: '#9ca3b8',
        fontSize: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>
            Current: <strong style={{ color: '#f9fafb' }}>{currentUser.role}</strong>
          </span>
          <span>
            ID: <strong style={{ color: '#f9fafb' }}>{currentUser.id}</strong>
          </span>
          <span>
            Permissions: <strong style={{ color: '#f9fafb' }}>{currentUser.permissions.length}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>
            Components: <strong style={{ color: componentValidation.every(r => r.status === 'OK') ? '#10b981' : '#f59e0b' }}>
              {componentValidation.filter(r => r.status === 'OK').length}/{componentValidation.length} OK
            </strong>
          </span>
          <span style={{ color: '#64748b' }}>
            Port: <strong>3005</strong>
          </span>
        </div>
      </div>

      {/* Inject spin animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: translateY(-50%) rotate(0deg); }
            100% { transform: translateY(-50%) rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}