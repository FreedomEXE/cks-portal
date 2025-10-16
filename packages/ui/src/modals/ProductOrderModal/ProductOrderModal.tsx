import React from 'react';
import styles from './ProductOrderModal.module.css';
import { ModalRoot } from '../ModalRoot';
import { DeletedBanner } from '../../banners/DeletedBanner';

interface ProductLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitOfMeasure: string | null;
}

interface ArchiveMetadata {
  archivedBy: string;
  archivedAt: string;
  reason?: string;
  scheduledDeletion?: string;
}

export interface ProductOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  } | null;
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

const ProductOrderModal: React.FC<ProductOrderModalProps> = ({
  isOpen,
  onClose,
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
  if (!isOpen || !order) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const formatStatus = (value?: string | null) => {
    if (!value) return '—';
    const pretty = value.replace(/_/g, ' ').replace(/-/g, ' ');
    return pretty
      .split(' ')
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(' ');
  };

  const getStatusColor = (status?: string | null) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'delivered' || normalized === 'completed') {
      return { bg: '#dcfce7', fg: '#166534' };
    } else if (normalized === 'cancelled' || normalized === 'rejected') {
      return { bg: '#fee2e2', fg: '#991b1b' };
    } else if (normalized.startsWith('pending')) {
      return { bg: '#fef3c7', fg: '#92400e' };
    } else if (normalized === 'awaiting_delivery' || normalized === 'in-progress') {
      return { bg: '#dbeafe', fg: '#1e3a8a' };
    }
    return { bg: '#f3f4f6', fg: '#111827' };
  };

  const statusColors = getStatusColor(order.status);

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Product Order Details</h2>
            <p className={styles.orderId}>{order.orderId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

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

        {/* Archive Information Banner */}
        {archiveMetadata && !order.isDeleted && (
          <div style={{
            margin: '16px 16px 0 16px',
            padding: '12px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #9ca3af',
            borderRadius: '6px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
              This order has been Archived
            </h4>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              Archive Information
            </h5>
            <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
              <div><strong>Archived by:</strong> {archiveMetadata.archivedBy || 'Admin'}</div>
              <div><strong>Archived on:</strong> {formatDate(archiveMetadata.archivedAt)}</div>
              {archiveMetadata.reason && (
                <div><strong>Reason:</strong> {archiveMetadata.reason}</div>
              )}
              {archiveMetadata.scheduledDeletion && (
                <div style={{ color: '#ef4444', fontWeight: 500, marginTop: '4px' }}>
                  <strong>Scheduled for deletion:</strong> {formatDate(archiveMetadata.scheduledDeletion)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Badge */}
        {order.status && (
          <div style={{ padding: '8px 16px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: statusColors.bg,
                color: statusColors.fg,
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {formatStatus(order.status)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {/* Service Information (if linked to a service) */}
          {order.serviceId && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Related Service</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Service ID</label>
                  <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>{order.serviceId}</p>
                </div>
              </div>
              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 6,
                fontSize: 13,
                color: '#1e40af',
              }}>
                ℹ️ This product order was created for service <strong>{order.serviceId}</strong>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                This product order is linked to a specific service
              </p>
            </section>
          )}

          {/* Order Information */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Order Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Availability Window</label>
                <p className={styles.value}>
                  {availability && availability.window && availability.days && availability.days.length > 0
                    ? `${availability.days.join(', ').toUpperCase()} ${availability.window.start}–${availability.window.end}` +
                      (availability.tz ? ` (${availability.tz})` : '')
                    : '—'}
                </p>
              </div>
            </div>
          </section>

          {/* Requestor Information */}
          {requestorInfo && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Requestor Information</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>
                    {order.requestedBy || '-'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Address</label>
                  <p className={styles.value}>{requestorInfo.address || '—'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Phone</label>
                  <p className={styles.value}>{requestorInfo.phone || '—'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <p className={styles.value}>{requestorInfo.email || '—'}</p>
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
                  <p className={styles.value}>
                    {order.destination || '-'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Address</label>
                  <p className={styles.value}>{destinationInfo.address || '—'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Contact Phone</label>
                  <p className={styles.value}>{destinationInfo.phone || '—'}</p>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Contact Email</label>
                  <p className={styles.value}>{destinationInfo.email || '—'}</p>
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
                        <td>{item.code || '—'}</td>
                        <td>{item.name}</td>
                        <td>{item.description || '—'}</td>
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
              <p className={styles.notes}>{cancellationReason || '—'}</p>
              <div className={styles.grid} style={{ marginTop: 8 }}>
                <div className={styles.field}>
                  <label className={styles.label}>Cancelled By</label>
                  <p className={styles.value}>{cancelledBy || '—'}</p>
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

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalRoot>
  );
};

export default ProductOrderModal;
