/*-----------------------------------------------
  Property of CKS  © 2025
-----------------------------------------------*/
/**
 * File: roleConfig.ts
 *
 * Description:
 * Role configuration schemas and definitions
 *
 * Responsibilities:
 * - Define role-specific configurations
 * - Provide role permissions and settings
 *
 * Role in system:
 * - Central role configuration management
 *
 * Notes:
 * Used for role-based access control
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

export interface RoleConfig {
  id: string;
  name: string;
  label: string;
  color: string;
  accentColor: string;
  permissions: string[];
  tabs: TabConfig[];
  features: string[];
}

export interface TabConfig {
  id: string;
  label: string;
  path: string;
  icon?: string;
  visible: boolean;
  permissions?: string[];
}

export const roleConfigs: Record<string, RoleConfig> = {
  admin: {
    id: 'admin',
    name: 'admin',
    label: 'Administrator',
    color: '#111827',
    accentColor: '#374151',
    permissions: ['*'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', visible: true },
      { id: 'users', label: 'User Management', path: '/admin/users', visible: true },
      { id: 'system', label: 'System Settings', path: '/admin/system', visible: true },
      { id: 'reports', label: 'Reports', path: '/admin/reports', visible: true },
      { id: 'audit', label: 'Audit Logs', path: '/admin/audit', visible: true },
      { id: 'support', label: 'Support', path: '/admin/support', visible: true },
    ],
    features: ['userManagement', 'systemSettings', 'auditLogs', 'reporting', 'fullAccess'],
  },
  manager: {
    id: 'manager',
    name: 'manager',
    label: 'Manager',
    color: '#3b82f6',
    accentColor: '#60a5fa',
    permissions: ['view', 'edit', 'create', 'approve'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/manager/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/manager/profile', visible: true },
      { id: 'ecosystem', label: 'My Ecosystem', path: '/manager/ecosystem', visible: true },
      { id: 'services', label: 'My Services', path: '/manager/services', visible: true },
      { id: 'orders', label: 'Orders', path: '/manager/orders', visible: true },
      { id: 'reports', label: 'Reports', path: '/manager/reports', visible: true },
      { id: 'support', label: 'Support', path: '/manager/support', visible: true },
    ],
    features: ['serviceManagement', 'orderApproval', 'reporting', 'teamManagement'],
  },
  contractor: {
    id: 'contractor',
    name: 'contractor',
    label: 'Contractor',
    color: '#10b981',
    accentColor: '#34d399',
    permissions: ['view', 'edit', 'create'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/contractor/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/contractor/profile', visible: true },
      { id: 'ecosystem', label: 'My Ecosystem', path: '/contractor/ecosystem', visible: true },
      { id: 'services', label: 'My Services', path: '/contractor/services', visible: true },
      { id: 'orders', label: 'Orders', path: '/contractor/orders', visible: true },
      { id: 'reports', label: 'Reports', path: '/contractor/reports', visible: true },
      { id: 'support', label: 'Support', path: '/contractor/support', visible: true },
    ],
    features: ['serviceExecution', 'orderManagement', 'crewManagement', 'reporting'],
  },
  customer: {
    id: 'customer',
    name: 'customer',
    label: 'Customer',
    color: '#eab308',
    accentColor: '#facc15',
    permissions: ['view', 'create', 'request'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/customer/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/customer/profile', visible: true },
      { id: 'ecosystem', label: 'My Ecosystem', path: '/customer/ecosystem', visible: true },
      { id: 'services', label: 'My Services', path: '/customer/services', visible: true },
      { id: 'orders', label: 'Orders', path: '/customer/orders', visible: true },
      { id: 'reports', label: 'Reports', path: '/customer/reports', visible: true },
      { id: 'support', label: 'Support', path: '/customer/support', visible: true },
    ],
    features: ['serviceRequest', 'orderTracking', 'centerManagement', 'reporting'],
  },
  center: {
    id: 'center',
    name: 'center',
    label: 'Center',
    color: '#f97316',
    accentColor: '#fb923c',
    permissions: ['view', 'edit', 'manage'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/center/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/center/profile', visible: true },
      { id: 'ecosystem', label: 'My Ecosystem', path: '/center/ecosystem', visible: true },
      { id: 'facility', label: 'Facility', path: '/center/facility', visible: true },
      { id: 'orders', label: 'Orders', path: '/center/orders', visible: true },
      { id: 'reports', label: 'Reports', path: '/center/reports', visible: true },
      { id: 'support', label: 'Support', path: '/center/support', visible: true },
    ],
    features: ['facilityManagement', 'crewCoordination', 'serviceTracking', 'reporting'],
  },
  crew: {
    id: 'crew',
    name: 'crew',
    label: 'Crew',
    color: '#ef4444',
    accentColor: '#f87171',
    permissions: ['view', 'execute', 'update'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/crew/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/crew/profile', visible: true },
      { id: 'ecosystem', label: 'My Ecosystem', path: '/crew/ecosystem', visible: true },
      { id: 'tasks', label: 'My Tasks', path: '/crew/tasks', visible: true },
      { id: 'schedule', label: 'Schedule', path: '/crew/schedule', visible: true },
      { id: 'reports', label: 'Reports', path: '/crew/reports', visible: true },
      { id: 'support', label: 'Support', path: '/crew/support', visible: true },
    ],
    features: ['taskExecution', 'scheduleManagement', 'timeTracking', 'reporting'],
  },
  warehouse: {
    id: 'warehouse',
    name: 'warehouse',
    label: 'Warehouse',
    color: '#8b5cf6',
    accentColor: '#a78bfa',
    permissions: ['view', 'manage', 'ship'],
    tabs: [
      { id: 'dashboard', label: 'Dashboard', path: '/warehouse/dashboard', visible: true },
      { id: 'profile', label: 'My Profile', path: '/warehouse/profile', visible: true },
      { id: 'inventory', label: 'Inventory', path: '/warehouse/inventory', visible: true },
      { id: 'orders', label: 'Orders', path: '/warehouse/orders', visible: true },
      { id: 'shipping', label: 'Shipping', path: '/warehouse/shipping', visible: true },
      { id: 'reports', label: 'Reports', path: '/warehouse/reports', visible: true },
      { id: 'support', label: 'Support', path: '/warehouse/support', visible: true },
    ],
    features: ['inventoryManagement', 'orderFulfillment', 'shippingCoordination', 'reporting'],
  },
};

export function getRoleConfig(role: string): RoleConfig | undefined {
  return roleConfigs[role];
}

export function getRolePermissions(role: string): string[] {
  const config = getRoleConfig(role);
  return config?.permissions || [];
}

export function hasPermission(role: string, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes('*') || permissions.includes(permission);
}