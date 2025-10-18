import React from 'react';
import styles from './ProductOrderModal.module.css';
import { DeletedBanner } from '../../banners/DeletedBanner';
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { formatTimezone, formatStatus, getStatusColors } from '../../utils/formatters';

interface ProductLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitOfMeasure: string | null;
}

interface ArchiveMetadata {
  archivedBy: string | null;
  archivedAt: string | null;
  reason?: string | null;
  scheduledDeletion?: string | null;
}

export interface ProductOrderContentProps {
  order: {
    orderId: string;
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    requestedDate: string | null;
    notes: string | null;
    status?: string | null;
    items?: ProductLineItem[];
    serviceId?: string | null;
    isDeleted?: boolean;
    deletedAt?: string;
    deletedBy?: string;
    fulfilledById?: string | null;
    fulfilledByName?: string | null;
  };
  requestorInfo?: {
    name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  destinationInfo?: {
    name: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  availability?: {
    tz: string | null;
    days: string[];
    window: { start: string; end: string } | null;
  } | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  archiveMetadata?: ArchiveMetadata | null;
}

export const ProductOrderContent: React.FC<ProductOrderContentProps> = ({
  order,
  requestorInfo,
  destinationInfo,
  availability,
  cancellationReason,
  cancelledBy,
  cancelledAt,
  rejectionReason,
  rejectedBy,
  rejectedAt,
  archiveMetadata,
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const statusColors = getStatusColors(order.status);

  return (
    <div>
      {/* Deleted Banner */}
      {order.isDeleted && (
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <DeletedBanner
            deletedAt={order.deletedAt}
            deletedBy={order.deletedBy}
            entityType="order"
            entityId={order.orderId}
          />
        </div>
      )}

      {/* Archive Banner */}
      {archiveMetadata && !order.isDeleted && (
        <div style={{ padding: '0 16px', marginTop: '16px' }}>
          <ArchivedBanner
            archivedAt={archiveMetadata.archivedAt || undefined}
            archivedBy={archiveMetadata.archivedBy || undefined}
            reason={archiveMetadata.reason || undefined}
            scheduledDeletion={archiveMetadata.scheduledDeletion || undefined}
            entityType="order"
            entityId={order.orderId}
          />
        </div>
      )}

      <div className={styles.body}>
        {/* Related Service (if linked) */}
        {order.serviceId && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Related Service</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Service ID</label>
                <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>
                  {order.serviceId}
                </p>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                fontSize: 13,
                color: '#1e40af',
              }}
            >
              ℹ️ This product order was created for service <strong>{order.serviceId}</strong>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
              This product order is linked to a specific service
            </p>
          </section>
        )}

        {/* Fulfilled By */}
        {(order.fulfilledById || order.fulfilledByName) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Fulfilled By</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>ID</label>
                <p className={styles.value}>{order.fulfilledById || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <p className={styles.value}>{order.fulfilledByName || '-'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Requestor Information */}
        {requestorInfo && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Requestor Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <p className={styles.value}>{order.requestedBy || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <p className={styles.value}>{requestorInfo.address || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone</label>
                <p className={styles.value}>{requestorInfo.phone || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <p className={styles.value}>{requestorInfo.email || '-'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Delivery Information */}
        {destinationInfo && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Delivery Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Destination</label>
                <p className={styles.value}>{order.destination || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Address</label>
                <p className={styles.value}>{destinationInfo.address || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact Phone</label>
                <p className={styles.value}>{destinationInfo.phone || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Contact Email</label>
                <p className={styles.value}>{destinationInfo.email || '-'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Availability */}
        {availability && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Availability</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Timezone</label>
                <p className={styles.value}>{availability.tz ? formatTimezone(availability.tz) : '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Days</label>
                <p className={styles.value}>{(availability.days || []).join(', ') || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Window</label>
                <p className={styles.value}>{availability.window ? `${availability.window.start} - ${availability.window.end}` : '-'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Product Items */}
        {order.items && order.items.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Product Items</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Product Code</th>
                    <th>Product Name</th>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code || '-'}</td>
                      <td>{item.name}</td>
                      <td>{item.description || '-'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitOfMeasure || 'EA'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Special Instructions */}
        {order.notes && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Special Instructions</h3>
            <p className={styles.notes}>{order.notes}</p>
          </section>
        )}

        {/* Cancellation Reason */}
        {order.status === 'cancelled' && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Cancellation Reason</h3>
            <p className={styles.notes}>{cancellationReason || '-'}</p>
            <div className={styles.grid} style={{ marginTop: 8 }}>
              <div className={styles.field}>
                <label className={styles.label}>Cancelled By</label>
                <p className={styles.value}>{cancelledBy || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Cancelled At</label>
                <p className={styles.value}>{formatDate(cancelledAt || null)}</p>
              </div>
            </div>
          </section>
        )}

        {/* Rejection Reason */}
        {order.status === 'rejected' && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Rejection Reason</h3>
            <p className={styles.notes}>{rejectionReason || '-'}</p>
            <div className={styles.grid} style={{ marginTop: 8 }}>
              <div className={styles.field}>
                <label className={styles.label}>Rejected By</label>
                <p className={styles.value}>{rejectedBy || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Rejected At</label>
                <p className={styles.value}>{formatDate(rejectedAt || null)}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductOrderContent;
