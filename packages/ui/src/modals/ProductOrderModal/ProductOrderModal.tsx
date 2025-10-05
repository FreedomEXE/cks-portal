import React from 'react';
import styles from './ProductOrderModal.module.css';

interface ProductLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitOfMeasure: string | null;
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
    <>
      <div className={styles.backdrop} onClick={onClose} />
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
                    {order.requestedBy && requestorInfo?.name
                      ? `${order.requestedBy} - ${requestorInfo.name}`
                      : order.requestedBy || requestorInfo?.name || '—'}
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
                    {order.destination && destinationInfo?.name
                      ? `${order.destination} - ${destinationInfo.name}`
                      : order.destination || destinationInfo?.name || '—'}
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
              <p className={styles.notes}>{rejectionReason || '—'}</p>
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
    </>
  );
};

export default ProductOrderModal;
