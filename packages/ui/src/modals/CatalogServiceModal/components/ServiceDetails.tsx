import React from 'react';
import styles from './ServiceDetails.module.css';

export interface ServiceDetailsProps {
  serviceId: string;
  serviceName: string;
  category?: string;
  status?: string;
  managedBy?: string;
  description?: string;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({
  serviceId,
  serviceName,
  category,
  status,
  managedBy,
  description,
}) => {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>SERVICE INFORMATION</h4>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Service ID</span>
          <span className={styles.detailValue}>{serviceId}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Name</span>
          <span className={styles.detailValue}>{serviceName}</span>
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

        {managedBy && (
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Managed By</span>
            <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
              {managedBy}
            </span>
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
  );
};

export default ServiceDetails;
