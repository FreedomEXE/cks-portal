import Button from '../../buttons/Button';
import styles from './MyHubSection.module.css';

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
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  };
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
  secondaryAction,
}: MyHubSectionProps) {
  const colors = roleColors[role?.toLowerCase() || 'manager'] || roleColors.manager;

  const welcomeContent = welcomeName
    ? <>Welcome, {welcomeName}!</>
    : <>Welcome to {hubName}!</>;
  return (
    <div className={styles.heroOuter}>
      <div className={styles.heroClamp}>
        <div
          className={styles.card}
          style={{ borderColor: colors.primary }}
        >
  {/* Header Row */}
        <div className={styles.headerRow}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 3.2vw, 40px)',
            fontWeight: 700,
            color: 'var(--text)'
          }}>
            {hubName}
          </h1>

          <div className={styles.headerActions}>
            {secondaryAction ? (
              <Button
                variant={secondaryAction.variant ?? 'secondary'}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
            <Button
              variant="primary"
              onClick={onLogout}
              roleColor={colors.primary}
            >
              Log out
            </Button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className={styles.welcomeRow}>
          {welcomeContent}
          {userId && (
            <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text)' }}>
              ({userId})
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                className={styles.tabButton}
                style={{
                  background: isActive ? colors.accent : 'var(--card-muted)',
                  color: isActive ? 'white' : 'var(--text)',
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--card-muted)';
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
    </div>
  );
}

