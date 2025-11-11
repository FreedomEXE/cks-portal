import React from 'react';
import Button from '../../buttons/Button/Button';
import styles from './WarehouseServiceModal.module.css';
import ActionBar, { type ActionDescriptor } from '../components/ActionBar/ActionBar';
import { ModalRoot } from '../ModalRoot';

export interface WarehouseServiceData {
  serviceId: string;
  serviceName: string;
  serviceType: 'one-time' | 'recurring';
  serviceStatus: string;
  centerId?: string | null;
  centerName?: string | null;
  centerAddress?: string | null;
  centerPhone?: string | null;
  centerEmail?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  startDate?: string | null;
  completedDate?: string | null;
  serviceStartNotes?: string | null;
  serviceCompleteNotes?: string | null;
}

export interface WarehouseServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: WarehouseServiceData | null;
  onStartService?: () => void;
  onCompleteService?: () => void;
  onCancelService?: () => void;
  actions?: ActionDescriptor[];
}

const WarehouseServiceModal: React.FC<WarehouseServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  onStartService,
  onCompleteService,
  onCancelService,
  actions,
}) => {
  if (!service) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStartDateDisplay = () => {
    const normalizedStatus = (service.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
    if (normalizedStatus === 'created') {
      return 'Not started';
    }
    return formatDate(service.startDate);
  };

  const normalizedStatus = (service.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
  const isCreated = normalizedStatus === 'created';
  const isInProgress = normalizedStatus === 'in_progress' || normalizedStatus === 'in progress' || normalizedStatus === 'active';
  const isCompleted = normalizedStatus === 'completed';

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Warehouse Service Details</h2>
            <p className={styles.subtitle}>{service.serviceId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        {actions && actions.length ? (
          <div style={{ padding: '0 16px' }}>
            <ActionBar actions={actions} />
          </div>
        ) : null}

        <div className={styles.content}>
          {/* Basic Information */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Service Name</label>
                <div className={styles.value}>{service.serviceName}</div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <div className={styles.value}>
                  {service.serviceType === 'recurring' ? 'Ongoing' : 'One-Time'}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <div className={styles.value}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                      backgroundColor: isCompleted ? '#dcfce7' : isInProgress ? '#dbeafe' : '#fef3c7',
                      color: isCompleted ? '#16a34a' : isInProgress ? '#2563eb' : '#ca8a04',
                    }}
                  >
                    {service.serviceStatus}
                  </span>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Start Date</label>
                <div className={styles.value}>{getStartDateDisplay()}</div>
              </div>
              {isCompleted && service.completedDate && (
                <div className={styles.field}>
                  <label className={styles.label}>Completed Date</label>
                  <div className={styles.value}>{formatDate(service.completedDate)}</div>
                </div>
              )}
            </div>
          </section>

          {/* Service Location */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Service Location</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Center</label>
                <div className={styles.value}>
                  {service.centerName || service.centerId || '—'}
                </div>
              </div>
              {service.centerAddress && (
                <div className={styles.field}>
                  <label className={styles.label}>Address</label>
                  <div className={styles.value}>{service.centerAddress}</div>
                </div>
              )}
              {service.centerPhone && (
                <div className={styles.field}>
                  <label className={styles.label}>Phone</label>
                  <div className={styles.value}>{service.centerPhone}</div>
                </div>
              )}
              {service.centerEmail && (
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <div className={styles.value}>{service.centerEmail}</div>
                </div>
              )}
            </div>
          </section>

          {/* Warehouse Assignment */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Warehouse Assignment</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label className={styles.label}>Assigned Warehouse</label>
                <div className={styles.value}>
                  {service.warehouseId
                    ? `${service.warehouseId}${service.warehouseName ? ' - ' + service.warehouseName : ''}`
                    : '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Service Notes */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Service Notes</h3>

            {service.serviceStartNotes && (
              <div className={styles.notesBlock}>
                <label className={styles.notesLabel}>Start Notes</label>
                <div className={styles.notesContent}>{service.serviceStartNotes}</div>
              </div>
            )}

            {service.serviceCompleteNotes && (
              <div className={styles.notesBlock}>
                <label className={styles.notesLabel}>Completion Notes</label>
                <div className={styles.notesContent}>{service.serviceCompleteNotes}</div>
              </div>
            )}

            {!service.serviceStartNotes && !service.serviceCompleteNotes && (
              <div className={styles.emptyState}>No notes added yet</div>
            )}
          </section>
        </div>

        <div className={styles.footer}>
          {isCreated && onStartService && (
            <Button variant="primary" onClick={onStartService} roleColor="#8b5cf6">
              Start Service
            </Button>
          )}
          {isInProgress && onCompleteService && (
            <Button variant="primary" onClick={onCompleteService} roleColor="#8b5cf6">
              Complete Service
            </Button>
          )}
          {(isCreated || isInProgress) && onCancelService && (
            <Button variant="secondary" onClick={onCancelService}>
              Cancel Service
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </ModalRoot>
  );
};

export default WarehouseServiceModal;
