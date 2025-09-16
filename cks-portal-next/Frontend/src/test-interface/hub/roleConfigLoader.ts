/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: roleConfigLoader.ts
 *
 * Description:
 * Role configuration loader for test interface
 *
 * Responsibilities:
 * - Load role configurations from generated configs
 * - Provide fallback test configurations
 * - Handle dynamic role loading for testing
 *
 * Role in system:
 * - Used by HubTester to load role configs
 * - Bridges generated configs with test interface
 *
 * Notes:
 * Provides mock data when generated configs are empty
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

// Available test roles
export type TestRole = 'admin' | 'manager' | 'customer' | 'contractor' | 'center' | 'crew' | 'warehouse';

export interface TestUserData {
  id: string;
  role: TestRole;
  permissions: string[];
  displayName: string;
  description: string;
}

export interface RoleConfig {
  role: string;
  tabs: Array<{
    id: string;
    label: string;
    component: string;
    icon?: string;
  }>;
  permissions: string[];
  features: Record<string, any>;
}

// Test user configurations (based on legacy test-hub-roles.tsx)
export const testUsers: Record<TestRole, TestUserData> = {
  admin: {
    id: 'ADM-TEST-001',
    role: 'admin',
    displayName: 'Admin Hub Test',
    description: 'Test the admin role with full system administration access',
    permissions: [
      // Core System
      'system:admin',
      'system:config',
      'system:monitor',
      'system:backup',
      // User Management
      'users:create',
      'users:view',
      'users:edit',
      'users:delete',
      'users:assign',
      'users:activate',
      'users:deactivate',
      // Organization Management
      'organizations:create',
      'organizations:view',
      'organizations:edit',
      'organizations:delete',
      // Role Management
      'roles:create',
      'roles:view',
      'roles:edit',
      'roles:assign',
      'roles:permissions',
      // Directory/Intelligence
      'directory:view',
      'directory:export',
      'directory:search',
      'directory:analytics',
      // Audit & Support
      'audit:view',
      'audit:export',
      'audit:manage',
      'support:admin',
      'support:escalate',
      'support:manage',
      // Reports
      'reports:system',
      'reports:users',
      'reports:security'
    ]
  },
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
      'orders:view',
      'reports:view',
      'support:access',
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
      'services:manage',
      'inventory:manage',
      'orders:process',
      'delivery:track',
      'support:access',
      'reports:generate'
    ]
  }
};

// Default/fallback role configurations
const defaultRoleConfigs: Record<TestRole, RoleConfig> = {
  admin: {
    role: 'admin',
    tabs: [
      { id: 'dashboard', label: 'System Dashboard', component: 'Dashboard' },
      { id: 'users', label: 'User Management', component: 'UserManagement' },
      { id: 'organizations', label: 'Organizations', component: 'Organizations' },
      { id: 'directory', label: 'Directory', component: 'Directory' },
      { id: 'audit', label: 'Audit Logs', component: 'AuditLogs' },
      { id: 'support', label: 'Support Admin', component: 'SupportAdmin' }
    ],
    permissions: testUsers.admin.permissions,
    features: {
      systemAdmin: true,
      userManagement: true,
      organizationManagement: true,
      auditAccess: true
    }
  },
  manager: {
    role: 'manager',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'My Profile', component: 'MyProfile' },
      { id: 'services', label: 'Services', component: 'Services' },
      { id: 'ecosystem', label: 'Ecosystem', component: 'Ecosystem' },
      { id: 'orders', label: 'Orders', component: 'Orders' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.manager.permissions,
    features: {
      serviceManagement: true,
      orderScheduling: true,
      reportManagement: true
    }
  },
  contractor: {
    role: 'contractor',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'My Profile', component: 'MyProfile' },
      { id: 'services', label: 'Services', component: 'Services' },
      { id: 'ecosystem', label: 'Ecosystem', component: 'Ecosystem' },
      { id: 'orders', label: 'Orders', component: 'Orders' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.contractor.permissions,
    features: {
      serviceManagement: true,
      orderApproval: true,
      premiumAccess: true
    }
  },
  customer: {
    role: 'customer',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'My Profile', component: 'MyProfile' },
      { id: 'services', label: 'Request Services', component: 'Services' },
      { id: 'ecosystem', label: 'Ecosystem', component: 'Ecosystem' },
      { id: 'orders', label: 'My Orders', component: 'Orders' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.customer.permissions,
    features: {
      serviceRequests: true,
      orderManagement: true,
      reportSubmission: true
    }
  },
  center: {
    role: 'center',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'Center Profile', component: 'MyProfile' },
      { id: 'facility', label: 'Facility Management', component: 'FacilityManagement' },
      { id: 'maintenance', label: 'Maintenance', component: 'Maintenance' },
      { id: 'visitors', label: 'Visitors', component: 'Visitors' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.center.permissions,
    features: {
      facilityManagement: true,
      maintenanceTracking: true,
      visitorManagement: true
    }
  },
  crew: {
    role: 'crew',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'My Profile', component: 'MyProfile' },
      { id: 'tasks', label: 'My Tasks', component: 'Tasks' },
      { id: 'schedule', label: 'Schedule', component: 'Schedule' },
      { id: 'equipment', label: 'Equipment', component: 'Equipment' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.crew.permissions,
    features: {
      taskManagement: true,
      scheduleAccess: true,
      equipmentManagement: true
    }
  },
  warehouse: {
    role: 'warehouse',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', component: 'Dashboard' },
      { id: 'profile', label: 'My Profile', component: 'MyProfile' },
      { id: 'inventory', label: 'Inventory', component: 'Inventory' },
      { id: 'orders', label: 'Order Processing', component: 'OrderProcessing' },
      { id: 'delivery', label: 'Delivery Tracking', component: 'DeliveryTracking' },
      { id: 'reports', label: 'Reports', component: 'Reports' },
      { id: 'support', label: 'Support', component: 'Support' }
    ],
    permissions: testUsers.warehouse.permissions,
    features: {
      inventoryManagement: true,
      orderProcessing: true,
      deliveryTracking: true
    }
  }
};

/**
 * Load role configuration from generated config or fallback to default
 */
export async function loadRoleConfig(role: TestRole): Promise<RoleConfig> {
  try {
    // Try to load generated config
    const generatedConfig = await import(`@roles/${role}/config.v1.json`);

    // If generated config has content, use it
    if (generatedConfig.default && Object.keys(generatedConfig.default).length > 0) {
      return generatedConfig.default;
    }

    // Fall back to default config
    console.warn(`[RoleConfigLoader] Using fallback config for ${role} - generated config is empty`);
    return defaultRoleConfigs[role];
  } catch (error) {
    console.warn(`[RoleConfigLoader] Failed to load config for ${role}, using fallback:`, error);
    return defaultRoleConfigs[role];
  }
}

/**
 * Load role component registry
 */
export async function loadRoleRegistry(role: TestRole): Promise<any> {
  try {
    const registry = await import(`@roles/${role}/index.ts`);
    return registry.default || {};
  } catch (error) {
    console.warn(`[RoleConfigLoader] Failed to load registry for ${role}:`, error);
    return {};
  }
}

/**
 * Validate role components exist
 */
export async function validateRoleComponents(role: TestRole): Promise<Array<{
  tabId: string;
  component: string;
  exists: boolean;
  status: 'OK' | 'MISSING';
}>> {
  try {
    const config = await loadRoleConfig(role);
    const registry = await loadRoleRegistry(role);

    const results = config.tabs.map((tab) => {
      const componentExists = !!registry.components?.[tab.component];
      return {
        tabId: tab.id,
        component: tab.component,
        exists: componentExists,
        status: componentExists ? 'OK' as const : 'MISSING' as const
      };
    });

    console.log(`[RoleConfigLoader] ${role} component validation:`, results);
    return results;
  } catch (error) {
    console.error(`[RoleConfigLoader] Error validating ${role} components:`, error);
    return [];
  }
}