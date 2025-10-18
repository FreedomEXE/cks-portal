import React from 'react';
import styles from './UserCard.module.css';
import StatusBadge from '../../badges/StatusBadge';
import TabContainer from '../../navigation/TabContainer';
import NavigationTab from '../../navigation/NavigationTab';

export interface UserAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}

export interface UserCardProps {
  userId: string;
  userName: string;
  status?: string;
  userRole?: string;
  variant?: 'default' | 'embedded';
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  tabContent?: React.ReactNode;
}

const UserCard: React.FC<UserCardProps> = ({
  userId,
  userName,
  status,
  userRole,
  variant = 'default',
  tabs,
  activeTab,
  onTabChange,
  tabContent,
}) => {
  return (
    <div className={`${styles.card} ${variant === 'embedded' ? styles.cardEmbedded : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.userInfo}>
          <span className={styles.userId}>
            {userId}
          </span>
        </div>
        <StatusBadge status={status || 'active'} variant="badge" />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{userName}</h3>

        {userRole && (
          <div className={styles.metadata}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Role:</span>
              <span className={styles.metaValue}>{userRole}</span>
            </div>
          </div>
        )}
      </div>

      {/* Optional tabs for embedded variant */}
      {variant === 'embedded' && tabs && tabs.length > 0 && (
        <div className={styles.cardTabs}>
          <TabContainer variant="underline" borderBottom={false} fullWidth={false}>
            {tabs.map((tab) => (
              <NavigationTab
                key={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => onTabChange?.(tab.id)}
                variant="default"
                activeColor="#6b7280"
              />
            ))}
          </TabContainer>
        </div>
      )}
    </div>
  );
};

export default UserCard;
