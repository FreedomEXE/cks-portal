import React from 'react';
import styles from './ProductCard.module.css';
import StatusBadge from '../../badges/StatusBadge';
import TabContainer from '../../navigation/TabContainer';
import NavigationTab from '../../navigation/NavigationTab';

export interface ProductCardProps {
  productId: string;
  productName: string;
  category?: string;
  unitOfMeasure?: string;
  status?: string;
  variant?: 'default' | 'embedded';
  // Optional tabs for embedded variant (modal usage)
  tabs?: Array<{ id: string; label: string }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  productName,
  category,
  unitOfMeasure,
  status = 'active',
  variant = 'default',
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className={`${styles.card} ${variant === 'embedded' ? styles.cardEmbedded : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.productInfo}>
          <span className={styles.productId}>{productId}</span>
        </div>
        <StatusBadge status={status} variant="badge" />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{productName}</h3>
        <div className={styles.metadata}>
          {category && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Category:</span>
              <span className={styles.metaValue}>{category}</span>
            </div>
          )}
          {unitOfMeasure && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Unit:</span>
              <span className={styles.metaValue}>{unitOfMeasure}</span>
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

export default ProductCard;
