import React, { useState } from 'react';

type TestRole = 'admin' | 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

export default function TestApp() {
  const [selectedRole, setSelectedRole] = useState<TestRole>('manager');

  const roles: TestRole[] = ['admin', 'manager', 'contractor', 'customer', 'center', 'crew', 'warehouse'];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#1e293b',
        padding: '1rem',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc' }}>
          CKS Test Interface - New Structure
        </h1>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                background: selectedRole === role ? '#3b82f6' : '#475569',
                color: 'white',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflow: 'auto' }}>
        <div style={{
          background: '#1e293b',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>
            Testing: {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Hub
          </h2>
          <p style={{ color: '#94a3b8', margin: 0 }}>
            This test interface will help you build and test components following the new structure:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Packages/UI Components */}
          <div style={{
            background: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>📦 packages/ui/</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Pure UI components (buttons, cards, tables) - role agnostic
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.25rem' }}>
              <code style={{ color: '#10b981', fontSize: '0.75rem' }}>
                MyHubSection, Button, DataTable, InfoCard
              </code>
            </div>
          </div>

          {/* Domain Widgets */}
          <div style={{
            background: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>🧩 packages/domain-widgets/</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Business logic components - role aware but agnostic
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.25rem' }}>
              <code style={{ color: '#10b981', fontSize: '0.75rem' }}>
                OrderList, ReportsCard, ActivityFeed, InventoryTable
              </code>
            </div>
          </div>

          {/* Hub Orchestrators */}
          <div style={{
            background: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>🎯 src/hubs/</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Hub orchestrators combining configs + components
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.25rem' }}>
              <code style={{ color: '#10b981', fontSize: '0.75rem' }}>
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}Hub.tsx
              </code>
            </div>
          </div>

          {/* Features */}
          <div style={{
            background: '#1e293b',
            borderRadius: '0.5rem',
            padding: '1rem',
            border: '1px solid #334155'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa' }}>✨ src/features/{selectedRole}/</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
              Role-specific features and components
            </p>
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#0f172a', borderRadius: '0.25rem' }}>
              <code style={{ color: '#10b981', fontSize: '0.75rem' }}>
                {getRoleFeatures(selectedRole)}
              </code>
            </div>
          </div>
        </div>

        {/* Status */}
        <div style={{
          marginTop: '2rem',
          background: '#1e293b',
          borderRadius: '0.5rem',
          padding: '1rem',
          border: '1px solid #10b981'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>✅ Test Interface Working</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            The test interface is now running on port {window.location.port}.
            Start building components in the new structure and they'll appear here for testing.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#1e293b',
        padding: '0.75rem 1rem',
        borderTop: '1px solid #334155',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <span>Role: {selectedRole} | Port: {window.location.port}</span>
        <span>CKS Portal Next - Test Interface v2.0.0</span>
      </div>
    </div>
  );
}

function getRoleFeatures(role: TestRole): string {
  const features: Record<TestRole, string> = {
    admin: 'CreateUsers, AssignRoles, SystemMetrics, AuditLogs',
    manager: 'MyEcosystem, ServiceCertification, TeamPerformance',
    contractor: 'CompanyProfile, AccountManager',
    customer: 'ServiceRequest, CenterManagement',
    center: 'FacilityDashboard, MaintenanceSchedule',
    crew: 'TimeClockWidget, TaskList',
    warehouse: 'InventoryManager, DeliveryScheduler, StockAlerts'
  };
  return features[role] || 'Loading...';
}