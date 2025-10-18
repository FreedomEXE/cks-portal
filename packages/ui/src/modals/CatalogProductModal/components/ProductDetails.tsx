import React from 'react';
import styles from './ProductDetails.module.css';

export interface ProductDetailsProps {
  productId: string;
  productName: string;
  category?: string;
  status?: string;
  description?: string;
  unitOfMeasure?: string;
  minimumOrderQuantity?: number | null;
  leadTimeDays?: number | null;
  metadata?: Record<string, any>;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  productId,
  productName,
  category,
  status,
  description,
  unitOfMeasure,
  minimumOrderQuantity,
  leadTimeDays,
  metadata,
}) => {
  return (
    <div className={styles.container}>
      {/* Product Information */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>PRODUCT INFORMATION</h4>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Product ID</span>
            <span className={styles.detailValue}>{productId}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Name</span>
            <span className={styles.detailValue}>{productName}</span>
          </div>

          {category && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Category</span>
              <span className={styles.detailValue}>{category}</span>
            </div>
          )}

          {status && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                {status}
              </span>
            </div>
          )}

          {unitOfMeasure && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Unit of Measure</span>
              <span className={styles.detailValue}>{unitOfMeasure}</span>
            </div>
          )}

          {description && (
            <div className={`${styles.detailItem} ${styles.fullWidth}`}>
              <span className={styles.detailLabel}>Description</span>
              <span className={styles.detailValue}>{description}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ordering Details */}
      {(minimumOrderQuantity !== null || leadTimeDays !== null) && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>ORDERING DETAILS</h4>
          <div className={styles.detailsGrid}>
            {minimumOrderQuantity !== null && minimumOrderQuantity !== undefined && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Minimum Order Quantity</span>
                <span className={styles.detailValue}>
                  {minimumOrderQuantity} {unitOfMeasure || 'EA'}
                </span>
              </div>
            )}

            {leadTimeDays !== null && leadTimeDays !== undefined && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Lead Time</span>
                <span className={styles.detailValue}>
                  {leadTimeDays} day{leadTimeDays === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Specifications */}
      {metadata && Object.keys(metadata).length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>SPECIFICATIONS</h4>
          <div className={styles.detailsGrid}>
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  {key.replace(/_/g, ' ').toUpperCase()}
                </span>
                <span className={styles.detailValue}>{String(value) || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
