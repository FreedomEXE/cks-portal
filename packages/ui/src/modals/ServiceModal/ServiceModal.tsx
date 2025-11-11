import React, { useState, useMemo } from 'react';
import styles from './ServiceModal.module.css';
import { ModalRoot } from '../ModalRoot';
import ActionBar, { type ActionDescriptor } from '../components/ActionBar/ActionBar';

// Base service info (SRV-001)
export interface ServiceInfo {
  serviceId: string;
  name: string;
  description: string | null;
  category: string | null;
  estimatedDuration: string | null;
  requirements: string[] | null;
  status: string;
  metadata?: any;
}

// Active service instance data (CEN-001-SRV-001)
export interface ActiveServiceData {
  instanceId: string;
  centerId: string | null;
  centerName: string | null;
  type: 'one-time' | 'recurring';
  status: string;
  startDate: string | null;
  endDate: string | null;
  managedBy: string | null;
  crew: Array<{ code: string; name: string }>;
  procedures: string[];
  training: string[];
  productOrdersCount?: number;
  notes?: string | null;
  // Action callbacks
  onStartService?: () => void;
  onCompleteService?: () => void;
  onCancelService?: () => void;
  onAddCrew?: () => void;
  onAddNotes?: () => void;
}

// Service history data
export interface ServiceHistoryData {
  instanceId: string;
  status: 'completed' | 'cancelled';
  completedAt: string | null;
  cancelledAt: string | null;
  completionNotes: string | null;
  cancellationReason: string | null;
  crew: Array<{ code: string; name: string }>;
  procedures: string[];
  training: string[];
  productOrdersCount?: number;
}

// User certification data (optional)
export interface UserCertification {
  certified: boolean;
  certificationDate: string | null;
  expiryDate: string | null;
  trainingCompleted: boolean;
}

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceInfo | null;
  activeData?: ActiveServiceData | null;
  historyData?: ServiceHistoryData | null;
  userCertification?: UserCertification | null;
  context: 'catalog' | 'myServices' | 'active' | 'history';
  actions?: ActionDescriptor[];
}

type TabId = 'info' | 'active' | 'history';

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  activeData,
  historyData,
  userCertification,
  context,
  actions,
}) => {
  // Determine tab configuration based on context
  const tabConfig = useMemo(() => {
    switch (context) {
      case 'catalog':
      case 'myServices':
        return { showTabs: false, defaultTab: 'info' as TabId };

      case 'active':
        return {
          showTabs: true,
          tabs: ['active' as TabId, 'info' as TabId],
          defaultTab: 'active' as TabId,
        };

      case 'history':
        return {
          showTabs: true,
          tabs: ['history' as TabId, 'active' as TabId, 'info' as TabId].filter(tab => {
            if (tab === 'active' && !activeData) return false;
            if (tab === 'history' && !historyData) return false;
            return true;
          }),
          defaultTab: 'history' as TabId,
        };

      default:
        return { showTabs: false, defaultTab: 'info' as TabId };
    }
  }, [context, activeData, historyData]);

  const [activeTab, setActiveTab] = useState<TabId>(tabConfig.defaultTab);

  if (!isOpen || !service) return null;

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
    if (normalized === 'completed' || normalized === 'active') {
      return { bg: '#dcfce7', fg: '#166534' };
    } else if (normalized === 'cancelled' || normalized === 'discontinued') {
      return { bg: '#fee2e2', fg: '#991b1b' };
    } else if (normalized === 'pending' || normalized === 'scheduled') {
      return { bg: '#fef3c7', fg: '#92400e' };
    } else if (normalized === 'in-progress' || normalized === 'in_progress') {
      return { bg: '#dbeafe', fg: '#1e3a8a' };
    }
    return { bg: '#f3f4f6', fg: '#111827' };
  };

  const statusColors = getStatusColor(service.status);

  // Tab labels
  const getTabLabel = (tabId: TabId) => {
    switch (tabId) {
      case 'info': return 'Service Info';
      case 'active': return 'Active Service';
      case 'history': return 'History';
    }
  };

  // Service Info Tab Content
  const renderServiceInfo = () => (
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Service Information</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>Service ID</label>
            <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>{service.serviceId}</p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Service Name</label>
            <p className={styles.value}>{service.name}</p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <p className={styles.value}>{service.category || '—'}</p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Estimated Duration</label>
            <p className={styles.value}>{service.estimatedDuration || '—'}</p>
          </div>
        </div>
      </section>

      {service.description && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.notes}>{service.description}</p>
        </section>
      )}

      {service.requirements && service.requirements.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Requirements</h3>
          <ul className={styles.list}>
            {service.requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </section>
      )}

      {userCertification && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Your Certification</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <p className={styles.value}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: userCertification.certified ? '#dcfce7' : '#fee2e2',
                  color: userCertification.certified ? '#166534' : '#991b1b',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  {userCertification.certified ? 'Certified' : 'Not Certified'}
                </span>
              </p>
            </div>
            {userCertification.certified && (
              <>
                <div className={styles.field}>
                  <label className={styles.label}>Certified Since</label>
                  <p className={styles.value}>{formatDate(userCertification.certificationDate)}</p>
                </div>
                {userCertification.expiryDate && (
                  <div className={styles.field}>
                    <label className={styles.label}>Expires</label>
                    <p className={styles.value}>{formatDate(userCertification.expiryDate)}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <label className={styles.label}>Training Completed</label>
                  <p className={styles.value}>{userCertification.trainingCompleted ? 'Yes' : 'No'}</p>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );

  // Active Service Tab Content
  const renderActiveService = () => {
    if (!activeData) return null;

    return (
      <>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Service Instance</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Instance ID</label>
              <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>{activeData.instanceId}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Type</label>
              <p className={styles.value}>{formatStatus(activeData.type)}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Center</label>
              <p className={styles.value}>{activeData.centerName || activeData.centerId || '—'}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Managed By</label>
              <p className={styles.value}>{activeData.managedBy || '—'}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Start Date</label>
              <p className={styles.value}>{formatDate(activeData.startDate)}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>End Date</label>
              <p className={styles.value}>{formatDate(activeData.endDate)}</p>
            </div>
          </div>
        </section>

        {activeData.crew && activeData.crew.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Assigned Crew ({activeData.crew.length})</h3>
            <div className={styles.listWrapper}>
              {activeData.crew.map((member, idx) => (
                <div key={idx} className={styles.listItem}>
                  <span className={styles.listItemCode}>{member.code}</span>
                  <span className={styles.listItemName}>{member.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeData.procedures && activeData.procedures.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Procedures</h3>
            <ul className={styles.list}>
              {activeData.procedures.map((proc, idx) => (
                <li key={idx}>{proc}</li>
              ))}
            </ul>
          </section>
        )}

        {activeData.training && activeData.training.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Training</h3>
            <ul className={styles.list}>
              {activeData.training.map((train, idx) => (
                <li key={idx}>{train}</li>
              ))}
            </ul>
          </section>
        )}

        {activeData.notes && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            <p className={styles.notes}>{activeData.notes}</p>
          </section>
        )}

        {activeData.productOrdersCount !== undefined && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Related Orders</h3>
            <p className={styles.value}>{activeData.productOrdersCount} product order(s)</p>
          </section>
        )}
      </>
    );
  };

  // History Tab Content
  const renderHistory = () => {
    if (!historyData) return null;

    const statusColors = getStatusColor(historyData.status);

    return (
      <>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Service Completion</h3>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label}>Instance ID</label>
              <p className={styles.value} style={{ color: '#2563eb', fontWeight: 500 }}>{historyData.instanceId}</p>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <p className={styles.value}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  background: statusColors.bg,
                  color: statusColors.fg,
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  {formatStatus(historyData.status)}
                </span>
              </p>
            </div>
            {historyData.completedAt && (
              <div className={styles.field}>
                <label className={styles.label}>Completed At</label>
                <p className={styles.value}>{formatDate(historyData.completedAt)}</p>
              </div>
            )}
            {historyData.cancelledAt && (
              <div className={styles.field}>
                <label className={styles.label}>Cancelled At</label>
                <p className={styles.value}>{formatDate(historyData.cancelledAt)}</p>
              </div>
            )}
          </div>
        </section>

        {historyData.completionNotes && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Completion Notes</h3>
            <p className={styles.notes}>{historyData.completionNotes}</p>
          </section>
        )}

        {historyData.cancellationReason && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Cancellation Reason</h3>
            <p className={styles.notes}>{historyData.cancellationReason}</p>
          </section>
        )}

        {historyData.crew && historyData.crew.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Crew Members</h3>
            <div className={styles.listWrapper}>
              {historyData.crew.map((member, idx) => (
                <div key={idx} className={styles.listItem}>
                  <span className={styles.listItemCode}>{member.code}</span>
                  <span className={styles.listItemName}>{member.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {historyData.procedures && historyData.procedures.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Procedures Used</h3>
            <ul className={styles.list}>
              {historyData.procedures.map((proc, idx) => (
                <li key={idx}>{proc}</li>
              ))}
            </ul>
          </section>
        )}

        {historyData.training && historyData.training.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Training Applied</h3>
            <ul className={styles.list}>
              {historyData.training.map((train, idx) => (
                <li key={idx}>{train}</li>
              ))}
            </ul>
          </section>
        )}

        {historyData.productOrdersCount !== undefined && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Related Orders</h3>
            <p className={styles.value}>{historyData.productOrdersCount} product order(s)</p>
          </section>
        )}
      </>
    );
  };

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Service Details</h2>
            <p className={styles.orderId}>{service.serviceId}</p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Status Badge */}
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
            {formatStatus(service.status)}
          </span>
        </div>

        {actions && actions.length ? (
          <div style={{ padding: '0 16px' }}>
            <ActionBar actions={actions} />
          </div>
        ) : null}

        {/* Tabs (if applicable) */}
        {tabConfig.showTabs && tabConfig.tabs && (
          <div className={styles.tabs}>
            {tabConfig.tabs.map((tabId) => (
              <button
                key={tabId}
                className={`${styles.tab} ${activeTab === tabId ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tabId)}
              >
                {getTabLabel(tabId)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {(!tabConfig.showTabs || activeTab === 'info') && renderServiceInfo()}
          {tabConfig.showTabs && activeTab === 'active' && renderActiveService()}
          {tabConfig.showTabs && activeTab === 'history' && renderHistory()}
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

export default ServiceModal;
