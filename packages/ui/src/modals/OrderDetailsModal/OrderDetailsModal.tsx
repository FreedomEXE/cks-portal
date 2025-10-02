import React from 'react';
import styles from './OrderDetailsModal.module.css';

interface OrderLineItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unitOfMeasure: string | null;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    orderId: string;
    orderType: 'service' | 'product';
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    requestedDate: string | null;
    notes: string | null;
    status?: string | null;
    items?: OrderLineItem[];
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
  infoBanner?: string | null;
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

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  requestorInfo,
  destinationInfo,
  infoBanner,
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

  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} />

      {/* Modal */}
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Order Details</h2>
            <p className={styles.orderId}>{order.orderId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Optional Info Banner */}
        {infoBanner && (
          <div style={{
            margin: '0 16px',
            marginTop: 12,
            padding: '10px 12px',
            background: '#1118270d',
            border: '1px solid #1118271a',
            borderRadius: 6,
            color: '#111827',
            fontSize: 13,
          }}>
            {infoBanner}
          </div>
        )}

        {/* Status Chip */}
        {order.status && (
          <div style={{ padding: '8px 16px' }}>
            {(() => {
              const normalized = (order.status || '').toLowerCase();
              let bg = '#f3f4f6';
              let fg = '#111827';
              if (normalized === 'delivered' || normalized === 'service_completed' || normalized === 'completed') {
                bg = '#dcfce7'; fg = '#166534';
              } else if (normalized === 'cancelled' || normalized === 'rejected') {
                bg = '#fee2e2'; fg = '#991b1b';
              } else if (normalized.startsWith('pending')) {
                bg = '#fef3c7'; fg = '#92400e';
              } else if (normalized === 'awaiting_delivery' || normalized === 'service_in_progress' || normalized === 'in-progress') {
                bg = '#dbeafe'; fg = '#1e3a8a';
              }
              return (
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: bg,
                  color: fg,
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  {formatStatus(order.status)}
                </span>
              );
            })()}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {/* Basic Info Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Order Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Order Type</label>
                <p className={styles.value}>{order.orderType === 'product' ? 'Product Order' : 'Service Order'}</p>
              </div>
              {/* Requested By removed from display per new spec */}
              {/* Requested Date removed for product orders; availability window is the source of truth */}
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

          {/* Requestor Information Section */}
          {requestorInfo && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Requestor Information</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Name</label>
                  <p className={styles.value}>{order.requestedBy && requestorInfo?.name ? (order.requestedBy + ' - ' + requestorInfo.name) : (order.requestedBy || requestorInfo?.name || '�')}</p>
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

          {/* Delivery Information Section */}
          {destinationInfo && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Delivery Information</h3>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Destination</label>
                  <p className={styles.value}>{order.destination && destinationInfo?.name ? (order.destination + ' - ' + destinationInfo.name) : (order.destination || destinationInfo?.name || '�')}</p>
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

          {/* Line Items Section */}
          {order.items && order.items.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Order Items</h3>
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

          {/* Special Instructions Section */}
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

export default OrderDetailsModal;



