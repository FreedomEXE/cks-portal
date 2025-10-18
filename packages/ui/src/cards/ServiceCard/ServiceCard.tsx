import React from 'react';
import styles from './ServiceCard.module.css';
import StatusBadge from '../../badges/StatusBadge';
import TabContainer from '../../navigation/TabContainer';
import NavigationTab from '../../navigation/NavigationTab';

export interface ServiceCardProps {
  serviceId: string;
  serviceName: string;
  category?: string;
  managedBy?: string;
  status?: string;
  description?: string;
  variant?: 'default' | 'embedded';
  // Optional tabs for embedded variant (modal usage)
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  serviceId,
  serviceName,
  category,
  managedBy,
  status = 'active',
  description,
  variant = 'default',
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={`${styles.card} ${variant === 'embedded' ? styles.cardEmbedded : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.serviceInfo}>
          <span className={styles.serviceId}>{serviceId}</span>
        </div>
        <StatusBadge status={status} variant="badge" />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{serviceName}</h3>
        <div className={styles.metadata}>
          {category && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Category:</span>
              <span className={styles.metaValue}>{category}</span>
            </div>
          )}
          {managedBy && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Managed By:</span>
              <span className={styles.metaValue}>{managedBy}</span>
            </div>
          )}
        </div>
      </div>

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

export default ServiceCard;
