import React from 'react';
import Button from '../../buttons/Button/Button';
import styles from './ServiceViewModal.module.css';

export interface ServiceViewData {
  serviceId: string;
  serviceName: string;
  serviceType: 'one-time' | 'recurring';
  serviceStatus: string;
  centerId?: string | null;
  centerName?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  startDate?: string | null;
  crew?: Array<{ code: string; name: string }>;
  procedures?: Array<{ id: string; name: string; description?: string }>;
  training?: Array<{ id: string; name: string; description?: string }>;
  notes?: string | null;
  products?: Array<{ orderId: string; productName: string; quantity: number; status: string }>;
}

export interface ServiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceViewData | null;
  onRequestProducts?: () => void;
  showProductsSection?: boolean;
}

const ServiceViewModal: React.FC<ServiceViewModalProps> = ({
  isOpen,
  onClose,
  service,
  onRequestProducts,
  showProductsSection = false,
}) => {
  if (!isOpen || !service) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const getStartDateDisplay = () => {
    const normalizedStatus = (service.serviceStatus || '').toLowerCase().replace(/\s+/g, '_');
    if (normalizedStatus === 'created') {
      return 'Pending';
    }
    return formatDate(service.startDate);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Service Details</h2>
            <p className={styles.subtitle}>{service.serviceId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

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
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
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
            </div>
          </section>

          {/* Location & Management */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Location & Management</h3>
            <div className={styles.grid}>
              {service.centerId && (
                <div className={styles.field}>
                  <label className={styles.label}>Center</label>
                  <div className={styles.value}>
                    {service.centerName || service.centerId}
                  </div>
                </div>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Managed By</label>
                <div className={styles.value}>
                  {service.managerId
                    ? `${service.managerId}${service.managerName ? ' - ' + service.managerName : ''}`
                    : '—'}
                </div>
              </div>
            </div>
          </section>

          {/* Assigned Crew */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Assigned Crew</h3>
            {service.crew && service.crew.length > 0 ? (
              <div className={styles.list}>
                {service.crew.map((crewMember) => (
                  <div key={crewMember.code} className={styles.listItem}>
                    <span className={styles.listItemCode}>{crewMember.code}</span>
                    <span className={styles.listItemName}>{crewMember.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No crew assigned yet</div>
            )}
          </section>

          {/* Procedures */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Procedures</h3>
            {service.procedures && service.procedures.length > 0 ? (
              <div className={styles.list}>
                {service.procedures.map((procedure) => (
                  <div key={procedure.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listItemName}>{procedure.name}</div>
                      {procedure.description && (
                        <div className={styles.listItemDescription}>
                          {procedure.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No procedures specified</div>
            )}
          </section>

          {/* Training */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Training Requirements</h3>
            {service.training && service.training.length > 0 ? (
              <div className={styles.list}>
                {service.training.map((item) => (
                  <div key={item.id} className={styles.listItem}>
                    <div>
                      <div className={styles.listItemName}>{item.name}</div>
                      {item.description && (
                        <div className={styles.listItemDescription}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No training requirements specified</div>
            )}
          </section>

          {/* Products */}
          {showProductsSection && (
            <section className={styles.section}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Products</h3>
                {onRequestProducts && (
                  <Button variant="primary" size="sm" onClick={onRequestProducts}>
                    Request Products
                  </Button>
                )}
              </div>
              {service.products && service.products.length > 0 ? (
                <div className={styles.list}>
                  {service.products.map((product) => (
                    <div key={product.orderId} className={styles.listItem}>
                      <div>
                        <div className={styles.listItemName}>{product.productName}</div>
                        <div className={styles.listItemDescription}>
                          Order: {product.orderId} • Qty: {product.quantity} • Status: {product.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>No products ordered for this service yet</div>
              )}
            </section>
          )}

          {/* Notes */}
          {service.notes && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Notes</h3>
              <div className={styles.notes}>{service.notes}</div>
            </section>
          )}
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
};

export default ServiceViewModal;
