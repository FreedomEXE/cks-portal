/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * RoleHub.tsx
 * 
 * Description: Universal role-based hub renderer with config-driven UI composition
 * Function: Load role config, apply permissions, render dynamic tabs based on role
 * Importance: Critical - Core component that enables single codebase for all roles
 * Connects to: Role configs, component registries, authentication system
 * 
 * Notes: Production-ready implementation with complete role orchestration.
 *        Supports dynamic tab loading, permission gating, and theme customization.
 */

import React, { useState, useEffect, useMemo } from 'react';

interface RoleHubProps {
  userId: string;
  role: string;
  userPermissions?: string[];
  className?: string;
}

interface TabConfig {
  id: string;
  label: string;
  component: string;
  icon: string;
  default?: boolean;
  requires?: string[];
}

interface RoleConfig {
  role: string;
  displayName: string;
  version: string;
  theme: {
    primaryColor: string;
    headerClass: string;
    accentColor: string;
  };
  tabs: TabConfig[];
  features: Record<string, any>;
  api: {
    baseUrl: string;
    endpoints: Record<string, string>;
  };
  permissions: {
    default: string[];
    required: Record<string, string>;
  };
}

interface ComponentRegistry {
  components: Record<string, React.ComponentType<any>>;
  utilityComponents: Record<string, React.ComponentType<any>>;
  api: any;
  hooks: any;
  utils: any;
  auth: any;
}

export default function RoleHub({ userId, role, userPermissions = [], className }: RoleHubProps) {
  const [config, setConfig] = useState<RoleConfig | null>(null);
  const [registry, setRegistry] = useState<ComponentRegistry | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get display name for role
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager': return 'Manager Demo';
      case 'contractor': return 'Contractor Demo';
      case 'customer': return 'Customer Demo';
      case 'center': return 'Center Demo';
      case 'crew': return 'Crew Demo';
      case 'warehouse': return 'Warehouse Demo';
      default: return 'User Demo';
    }
  };

  // Load role configuration and component registry
  useEffect(() => {
    const loadRoleAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load role configuration
        const configResponse = await import(`./roles/${role}/config.v1.json`);
        const roleConfig: RoleConfig = configResponse.default || configResponse;

        // Load component registry
        const registryResponse = await import(`./roles/${role}/index.ts`);
        const componentRegistry: ComponentRegistry = registryResponse.default || registryResponse;

        setConfig(roleConfig);
        setRegistry(componentRegistry);

        // Set default active tab
        const defaultTab = roleConfig.tabs.find(tab => tab.default)?.id || roleConfig.tabs[0]?.id;
        setActiveTab(defaultTab);

      } catch (err) {
        console.error(`Failed to load role assets for ${role}:`, err);
        setError(`Failed to load ${role} role configuration`);
      } finally {
        setLoading(false);
      }
    };

    if (role) {
      loadRoleAssets();
    }
  }, [role]);

  // Filter tabs based on user permissions
  const availableTabs = useMemo(() => {
    if (!config) return [];

    return config.tabs.filter(tab => {
      if (!tab.requires || tab.requires.length === 0) return true;
      return tab.requires.some(permission => userPermissions.includes(permission));
    });
  }, [config, userPermissions]);

  // Check if user has required permissions for a tab
  const hasPermission = (requirements: string[] = []) => {
    if (requirements.length === 0) return true;
    return requirements.some(permission => userPermissions.includes(permission));
  };

  // Render active tab component
  const renderActiveTab = () => {
    if (!config || !registry || !activeTab) return null;

    const tabConfig = config.tabs.find(tab => tab.id === activeTab);
    if (!tabConfig) return null;

    const Component = registry.components[tabConfig.component];
    if (!Component) {
      return (
        <div style={{ padding: 20, textAlign: 'center', color: '#ef4444' }}>
          Component '{tabConfig.component}' not found in registry
        </div>
      );
    }

    // Check permissions before rendering
    if (!hasPermission(tabConfig.requires)) {
      return (
        <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Access Denied</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            You don't have permission to access this section
          </div>
        </div>
      );
    }

    return (
      <Component
        userId={userId}
        config={config}
        features={config.features}
        api={registry.api}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
        <div>Loading {role} hub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>❌</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Error Loading Hub</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!config || availableTabs.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🚫</div>
        <div style={{ fontSize: 16, fontWeight: 500 }}>No Available Tabs</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>
          No tabs are available for your current permissions
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Header Section - matches legacy layout with blue wrapper */}
      <div style={{ 
        padding: '16px 24px 24px 24px',
        background: '#f9fafb'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: `3px solid ${config.theme.primaryColor}`,
          padding: '20px 24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
        {/* Top header bar with title and logout */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: 32, 
            fontWeight: 700,
            color: '#111827'
          }}>
            {config.displayName}
          </h1>
          <button style={{
            padding: '8px 16px',
            background: config.theme.primaryColor,
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            Log out
          </button>
        </div>

        {/* Welcome message */}
        <div style={{
          fontSize: 16,
          color: '#6b7280',
          marginBottom: '16px'
        }}>
          Welcome, {getRoleDisplayName(role)} ({userId})!
        </div>

        {/* Tab Navigation - pill style like legacy */}
        <div style={{ display: 'flex', gap: 8 }}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 6,
                background: activeTab === tab.id ? '#374151' : '#f3f4f6',
                color: activeTab === tab.id ? 'white' : '#374151',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* Tab Content - Hybrid approach: edge-to-edge background with centered content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        background: '#f9fafb'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '24px',
          width: '100%'
        }}>
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
