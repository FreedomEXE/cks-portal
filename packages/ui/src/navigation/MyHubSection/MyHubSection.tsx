import Button from '../../buttons/Button';

export interface Tab {
  id: string;
  label: string;
  path: string;
  icon?: string;
}

export interface MyHubSectionProps {
  hubName: string;
  tabs: Tab[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
  onLogout: () => void;
  userId?: string;
  role?: string;
  welcomeName?: string;
}

// Role-based color mapping
const roleColors: Record<string, { primary: string; accent: string }> = {
  admin: { primary: '#111827', accent: '#374151' },      // Black/Gray
  manager: { primary: '#3b82f6', accent: '#60a5fa' },    // Blue
  contractor: { primary: '#10b981', accent: '#34d399' }, // Green
  customer: { primary: '#eab308', accent: '#facc15' },   // Yellow
  center: { primary: '#f97316', accent: '#fb923c' },     // Orange
  crew: { primary: '#ef4444', accent: '#f87171' },       // Red
  warehouse: { primary: '#8b5cf6', accent: '#a78bfa' },  // Purple
};

export default function MyHubSection({
  hubName,
  tabs,
  activeTab,
  onTabClick,
  onLogout,
  userId,
  role = 'manager',
  welcomeName,
}: MyHubSectionProps) {
  const colors = roleColors[role?.toLowerCase() || 'manager'] || roleColors.manager;

  const welcomeContent = (
    <>Welcome to {hubName}!</>
  );
  return (
    <div style={{ padding: '16px 24px 24px 24px', background: '#f9fafb' }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        border: `3px solid ${colors.primary}`,
        padding: '20px 24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
  {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            color: '#111827'
          }}>
            {hubName}
          </h1>

          <Button
            variant="primary"
            onClick={onLogout}
            roleColor={colors.primary}
          >
            Log out
          </Button>
        </div>

        {/* Welcome Message */}
        <div style={{
          fontSize: 14,
          color: '#4b5563',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
        }}>
          {welcomeContent}
          {userId && (
            <span style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>
              ({userId})
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 16,
          flexWrap: 'wrap'
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: isActive ? colors.accent : '#f3f4f6',
                  color: isActive ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

