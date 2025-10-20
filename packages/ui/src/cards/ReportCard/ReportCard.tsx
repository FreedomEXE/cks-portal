import React from 'react';
import styles from './ReportCard.module.css';
import StatusBadge from '../../badges/StatusBadge';
import TabContainer from '../../navigation/TabContainer';
import NavigationTab from '../../navigation/NavigationTab';

export interface ReportCardProps {
  reportId: string;
  type: 'report' | 'feedback';
  reportReason?: string;
  status: 'open' | 'resolved' | 'closed';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
  rating?: number | null; // 1-5 stars for feedback
  variant?: 'default' | 'embedded';
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  reportId,
  type,
  reportReason,
  status,
  priority,
  rating,
  variant = 'default',
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={`${styles.reportCard} ${variant === 'embedded' ? styles.embeddedCard : ''}`}>
      {/* Header: ID left, Status right (SAME AS ORDERCARD) */}
      <div className={styles.cardHeader}>
        <div className={styles.reportInfo}>
          <span className={styles.reportId}>{reportId}</span>
        </div>
        <StatusBadge status={status} variant="badge" />
      </div>

      {/* Body: Title and metadata */}
      <div className={styles.cardBody}>
        <h3 className={styles.title}>{reportReason || 'Untitled Report'}</h3>

        <div className={styles.metadata}>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>
            {type === 'report' ? 'Report' : 'Feedback'}
            {priority && ` · ${priority} Priority`}
            {rating && rating > 0 && ` · ${rating}/5 Stars`}
          </span>
        </div>
      </div>

      {/* Tabs at bottom (SAME AS ORDERCARD) */}
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

export default ReportCard;
