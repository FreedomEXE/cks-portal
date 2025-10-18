import React from 'react';
import styles from './ServiceOrderModal.module.css';
import { DeletedBanner } from '../../banners/DeletedBanner';
import { ArchivedBanner } from '../../banners/ArchivedBanner';

interface ArchiveMetadata {
  archivedBy: string | null;
  archivedAt: string | null;
  reason?: string | null;
  scheduledDeletion?: string | null;
}

export interface ServiceOrderContentProps {
  order: {
    orderId: string;
    title: string | null;
    requestedBy: string | null;
    destination: string | null;
    requestedDate: string | null;
    notes: string | null;
    status?: string | null;
    managedBy?: string | null;
    managedById?: string | null;
    managedByName?: string | null;
    serviceId?: string | null;
    isDeleted?: boolean;
    deletedAt?: string;
    deletedBy?: string;
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
  serviceDetails?: {
    serviceId: string;
    serviceName: string | null;
    serviceType: string | null;
    description: string | null;
    status: string | null;
  } | null;
  cancellationReason?: string | null;
  cancelledBy?: string | null;
  cancelledAt?: string | null;
  rejectionReason?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  archiveMetadata?: ArchiveMetadata | null;
}

export const ServiceOrderContent: React.FC<ServiceOrderContentProps> = ({
  order,
  requestorInfo,
  destinationInfo,
  availability,
  serviceDetails,
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

  const formatStatus = (value?: string | null) => {
    if (!value) return '-';
    const pretty = value.replace(/_/g, ' ').replace(/-/g, ' ');
    return pretty
      .split(' ')
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(' ');
  };

  const getStatusColor = (status?: string | null) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'service_completed' || normalized === 'completed' || normalized === 'service-created' || normalized === 'service_created') {
      return { bg: '#dcfce7', fg: '#166534' };
    } else if (normalized === 'cancelled' || normalized === 'rejected') {
      return { bg: '#fee2e2', fg: '#991b1b' };
    } else if (normalized.startsWith('pending') || normalized === 'manager_accepted' || normalized === 'manager-accepted') {
      return { bg: '#fef3c7', fg: '#92400e' };
    } else if (normalized === 'service_in_progress' || normalized === 'in-progress' || normalized === 'crew_requested' || normalized === 'crew-requested' || normalized === 'crew_assigned' || normalized === 'crew-assigned') {
      return { bg: '#dbeafe', fg: '#1e3a8a' };
    }
    return { bg: '#f3f4f6', fg: '#111827' };
  };

  const statusColors = getStatusColor(order.status);

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
        {/* (Removed duplicate Order Information; header already shows these) */}

        {/* Managed By */}
        {(order.managedById || order.managedByName) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Managed By</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>ID</label>
                <p className={styles.value}>{order.managedById || '-'}</p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <p className={styles.value}>{order.managedByName || '-'}</p>
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
                <p className={styles.value}>{requestorInfo.name || '-'}</p>
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
                <p className={styles.value}>{availability.tz || '-'}</p>
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

        {/* Service Info */}
        {serviceDetails && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Service Info</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Service Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{serviceDetails.serviceId || '-'}</td>
                    <td>{serviceDetails.serviceName || '-'}</td>
                    <td>{serviceDetails.serviceType || '-'}</td>
                    <td>{serviceDetails.description || '-'}</td>
                  </tr>
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

export default ServiceOrderContent;
