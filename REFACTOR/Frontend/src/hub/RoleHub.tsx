/**
 * RoleHub.tsx
 * Universal role-based hub renderer with config-driven UI composition.
 */

import React, { useEffect, useMemo, useState } from 'react';

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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'contractor': return 'Contractor';
      case 'customer': return 'Customer';
      case 'center': return 'Center';
      case 'crew': return 'Crew';
      case 'warehouse': return 'Warehouse';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  useEffect(() => {
    const loadRoleAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        const configResponse = await import(`./roles/${role}/config.v1.json`);
        const roleConfig: RoleConfig = (configResponse as any).default || configResponse;

        const registryResponse = await import(`./roles/${role}/index.ts`);
        const componentRegistry: ComponentRegistry = (registryResponse as any).default || registryResponse;

        setConfig(roleConfig);
        setRegistry(componentRegistry);

        const defaultTab = roleConfig.tabs.find(tab => tab.default)?.id || roleConfig.tabs[0]?.id || '';
        setActiveTab(defaultTab);
      } catch (err) {
        console.error(`Failed to load role assets for ${role}:`, err);
        setError(`Failed to load ${role} role configuration`);
      } finally {
        setLoading(false);
      }
    };

    if (role) loadRoleAssets();
  }, [role]);

  const availableTabs = useMemo(() => {
    if (!config) return [] as TabConfig[];
    return config.tabs.filter(tab => !tab.requires || tab.requires.length === 0 || tab.requires.some(p => userPermissions.includes(p)));
  }, [config, userPermissions]);

  const hasPermission = (requirements: string[] = []) => {
    if (requirements.length === 0) return true;
    return requirements.some(permission => userPermissions.includes(permission));
  };

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

    if (!hasPermission(tabConfig.requires)) {
      return (
        <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Access Denied</div>
          <div style={{ fontSize: 14 }}>You don't have permission to access this section</div>
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
        <div style={{ fontSize: 16, marginBottom: 8 }}>Loading…</div>
        <div>Loading {role} hub...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Error Loading Hub</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!config || availableTabs.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>No Available Tabs</div>
        <div style={{ fontSize: 14, marginTop: 4 }}>No tabs are available for your current permissions</div>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 24px 24px', background: '#f9fafb' }}>
        <div style={{ background: '#ffffff', borderRadius: 12, border: `3px solid ${config.theme.primaryColor}`, padding: '20px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#111827' }}>{config.displayName}</h1>
            <button
              onClick={() => {
                try { localStorage.setItem('userLoggedOut', 'true'); } catch {}
                try { sessionStorage.removeItem('role'); sessionStorage.removeItem('code'); } catch {}
                window.location.href = 'http://localhost:5183/login';
              }}
              style={{ padding: '8px 16px', background: config.theme.primaryColor, color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>Welcome to {config.displayName}</div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 6,
                  background: activeTab === tab.id ? (config.theme?.accentColor || config.theme.primaryColor) : '#f3f4f6',
                  color: activeTab === tab.id ? 'white' : '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id
                    ? `inset 0 -2px 0 0 ${config.theme?.accentColor || config.theme.primaryColor}`
                    : 'inset 0 -2px 0 0 transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: 24, width: '100%' }}>
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
