/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * test-manager-hub.tsx
 * 
 * Description: Test component to verify manager hub functionality
 * Function: Test RoleHub with manager role to ensure all components load properly
 * Importance: Testing - Verify refactored manager hub matches legacy behavior
 * Connects to: RoleHub.tsx, manager config, manager components
 * 
 * Notes: Temporary test file to validate complete manager hub implementation.
 *        Should be used to test before deploying to production.
 */

import React from 'react';
import RoleHub from './hub/RoleHub';

// Test component for Manager Hub
export default function TestManagerHub() {
  // Mock user data for testing
  const testUserId = 'MGR-TEST-001';
  const testRole = 'manager';
  const testPermissions = [
    'dashboard:view',
    'profile:view', 
    'services:manage',
    'ecosystem:view',
    'orders:view',
    'orders:schedule',
    'reports:view',
    'reports:manage',
    'support:access'
  ];

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RoleHub 
        userId={testUserId}
        role={testRole}
        userPermissions={testPermissions}
        className="manager-hub-test"
      />
    </div>
  );
}

// Export for testing individual components
export const TestComponents = {
  // Test individual manager components
  TestDashboard: () => {
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
  
  TestMyProfile: () => {
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
  
  TestMyServices: () => {
    const MyServices = require('./hub/roles/manager/tabs/MyServices').default;
    return (
      <MyServices 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestEcosystem: () => {
    const Ecosystem = require('./hub/roles/manager/tabs/Ecosystem').default;
    return (
      <Ecosystem 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestOrders: () => {
    const Orders = require('./hub/roles/manager/tabs/Orders').default;
    return (
      <Orders 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestReports: () => {
    const Reports = require('./hub/roles/manager/tabs/Reports').default;
    return (
      <Reports 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  },
  
  TestSupport: () => {
    const Support = require('./hub/roles/manager/tabs/Support').default;
    return (
      <Support 
        userId="MGR-TEST-001"
        config={{}}
        features={{}}
        api={{}}
      />
    );
  }
};