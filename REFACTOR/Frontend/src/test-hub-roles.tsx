/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * test-hub-roles.tsx
 * 
 * Description: Comprehensive test component for all role hubs
 * Function: Test RoleHub with different roles to ensure all components load properly
 * Importance: Testing - Verify refactored hubs match legacy behavior
 * Connects to: RoleHub.tsx, role configs, role components
 * 
 * Notes: Comprehensive test interface with role switching capabilities.
 *        Includes both manager and contractor hubs for complete testing.
 */

import React, { useState } from 'react';
import RoleHub from './hub/RoleHub';

// Available test roles
type TestRole = 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';

interface TestUserData {
  id: string;
  role: TestRole;
  permissions: string[];
  displayName: string;
  description: string;
}

// Test user configurations
const testUsers: Record<TestRole, TestUserData> = {
  manager: {
    id: 'MGR-TEST-001',
    role: 'manager',
    displayName: 'Manager Hub Test',
    description: 'Test the manager role with full permissions',
    permissions: [
      'dashboard:view',
      'profile:view', 
      'services:manage',
      'ecosystem:view',
      'orders:view',
      'orders:schedule',
      'reports:view',
      'reports:manage',
      'support:access'
    ]
  },
  contractor: {
    id: 'CON-TEST-001',
    role: 'contractor',
    displayName: 'Contractor Hub Test',
    description: 'Test the contractor role with premium permissions',
    permissions: [
      'dashboard:view',
      'profile:view',
      'services:manage',
      'ecosystem:view',
      'orders:view',
      'orders:approve',
      'reports:view',
      'support:access'
    ]
  },
  customer: {
    id: 'CUS-TEST-001',
    role: 'customer',
    displayName: 'Customer Hub Test',
    description: 'Test the customer role with center management permissions',
    permissions: [
      'dashboard:view',
      'profile:view',
      'services:request',
      'ecosystem:view',
      'orders:view',
      'orders:modify',
      'reports:submit',
      'reports:view',
      'support:access'
    ]
  },
  center: {
    id: 'CEN-TEST-001',
    role: 'center',
    displayName: 'Center Hub Test',
    description: 'Test the center management role with facility operations',
    permissions: [
      'dashboard:view',
      'profile:view',
      'services:manage',
      'ecosystem:view',
      'orders:view',
      'reports:view',
      'support:access',
      'facility:manage',
      'maintenance:view',
      'visitors:track'
    ]
  },
  crew: {
    id: 'CRW-TEST-001',
    role: 'crew',
    displayName: 'Crew Hub Test',
    description: 'Test the crew member role with task management',
    permissions: [
      'dashboard:view',
      'profile:view',
      'services:view',
      'ecosystem:view',
      'tasks:manage',
      'schedule:view',
      'equipment:use'
    ]
  },
  warehouse: {
    id: 'WHS-TEST-001',
    role: 'warehouse',
    displayName: 'Warehouse Hub Test',
    description: 'Test the warehouse role with inventory and order management',
    permissions: [
      'dashboard:view',
      'profile:view',
      'inventory:manage',
      'orders:process',
      'shipping:track',
      'reports:generate'
    ]
  }
};

export default function TestHubRoles() {
  const [selectedRole, setSelectedRole] = useState<TestRole>('manager');
  const currentUser = testUsers[selectedRole];

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Role Selector Header */}
      <div style={{ 
        background: '#1f2937', 
        padding: '1rem', 
        borderBottom: '2px solid #374151',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0
      }}>
        <div style={{ color: '#f9fafb', fontWeight: 'bold', fontSize: '1.1rem' }}>
          CKS Hub Testing Interface
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          {Object.entries(testUsers).map(([role, userData]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role as TestRole)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: selectedRole === role ? '#3b82f6' : '#4b5563',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedRole !== role) {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedRole !== role) {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                }
              }}
            >
              {userData.displayName}
            </button>
          ))}
        </div>
        
        <div style={{ 
          color: '#9ca3af', 
          fontSize: '0.875rem',
          padding: '0.5rem',
          backgroundColor: '#374151',
          borderRadius: '0.375rem'
        }}>
          Testing: {currentUser.description}
        </div>
      </div>

      {/* Role Hub Container */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <RoleHub 
          userId={currentUser.id}
          role={currentUser.role}
          userPermissions={currentUser.permissions}
          className={`${currentUser.role}-hub-test`}
        />
      </div>

      {/* Debug Info Footer */}
      <div style={{ 
        background: '#111827', 
        padding: '0.75rem', 
        borderTop: '1px solid #374151',
        color: '#9ca3af',
        fontSize: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div>
          Current Role: <span style={{ color: '#f9fafb', fontWeight: '500' }}>{currentUser.role}</span> | 
          User ID: <span style={{ color: '#f9fafb', fontWeight: '500' }}>{currentUser.id}</span>
        </div>
        <div>
          Permissions: {currentUser.permissions.length} loaded
        </div>
      </div>
    </div>
  );
}

// Export individual test components for debugging
export const TestComponents = {
  // Manager Components
  TestManagerDashboard: () => {
    const Dashboard = require('./hub/roles/manager/tabs/Dashboard').default;
    return (
      <Dashboard 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestManagerProfile: () => {
    const MyProfile = require('./hub/roles/manager/tabs/MyProfile').default;
    return (
      <MyProfile 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },

  // Contractor Components  
  TestContractorDashboard: () => {
    const Dashboard = require('./hub/roles/contractor/tabs/Dashboard').default;
    return (
      <Dashboard 
        userId="CON-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestContractorProfile: () => {
    const MyProfile = require('./hub/roles/contractor/tabs/MyProfile').default;
    return (
      <MyProfile 
        userId="CON-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },

  // Customer Components
  TestCustomerDashboard: () => {
    const Dashboard = require('./hub/roles/customer/tabs/Dashboard').default;
    return (
      <Dashboard 
        userId="CUS-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestCustomerProfile: () => {
    const MyProfile = require('./hub/roles/customer/tabs/MyProfile').default;
    return (
      <MyProfile 
        userId="CUS-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },

  // Full Hub Tests
  TestManagerHub: () => {
    return (
      <RoleHub 
        userId="MGR-TEST-001"
        role="manager"
        userPermissions={testUsers.manager.permissions}
        className="manager-hub-test"
      />
    );
  },

  TestContractorHub: () => {
    return (
      <RoleHub 
        userId="CON-TEST-001"
        role="contractor"
        userPermissions={testUsers.contractor.permissions}
        className="contractor-hub-test"
      />
    );
  },

  TestCustomerHub: () => {
    return (
      <RoleHub 
        userId="CUS-TEST-001"
        role="customer"
        userPermissions={testUsers.customer.permissions}
        className="customer-hub-test"
      />
    );
  }
};

// Export test utilities
export const TestUtils = {
  // Helper to test specific role configurations
  testRoleConfig: (role: TestRole) => {
    const config = require(`./hub/roles/${role}/config.v1.json`);
    console.log(`[TestUtils] ${role} config:`, config);
    return config;
  },

  // Helper to test component registry
  testComponentRegistry: (role: TestRole) => {
    const registry = require(`./hub/roles/${role}/index.ts`);
    console.log(`[TestUtils] ${role} components:`, Object.keys(registry.components || {}));
    return registry;
  },

  // Helper to validate all role components load
  validateRoleComponents: async (role: TestRole) => {
    try {
      const config = require(`./hub/roles/${role}/config.v1.json`);
      const registry = require(`./hub/roles/${role}/index.ts`);
      
      const results = config.tabs.map((tab: any) => {
        const componentExists = !!registry.components[tab.component];
        return {
          tabId: tab.id,
          component: tab.component,
          exists: componentExists,
          status: componentExists ? 'OK' : 'MISSING'
        };
      });
      
      console.log(`[TestUtils] ${role} component validation:`, results);
      return results;
    } catch (error) {
      console.error(`[TestUtils] Error validating ${role} components:`, error);
      return [];
    }
  }
};