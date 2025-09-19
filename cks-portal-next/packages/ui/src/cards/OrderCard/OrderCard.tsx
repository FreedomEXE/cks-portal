import React, { useState } from 'react';
import styles from './OrderCard.module.css';

interface ApprovalStage {
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  user?: string;
  timestamp?: string;
}

interface OrderCardProps {
  orderId: string;
  orderType: 'service' | 'supply';
  title: string;
  requestedBy: string;
  requestedDate: string;
  expectedDate?: string;
  status: 'pending' | 'in-progress' | 'approved' | 'rejected' | 'cancelled';
  approvalStages?: ApprovalStage[];
  onAction?: (action: string) => void;
  actions?: string[];
  details?: React.ReactNode;
  showWorkflow?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  transformedId?: string;
}

const OrderCard: React.FC<OrderCardProps> = ({
  orderId,
  orderType,
  title,
  requestedBy,
  requestedDate,
  expectedDate,
  status,
  approvalStages = [],
  onAction,
  actions = [],
  details,
  showWorkflow = true,
  collapsible = false,
  defaultExpanded = false,
  transformedId
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.statusGreen;
      case 'pending':
      case 'waiting':
        return styles.statusYellow;  // Back to yellow for pending
      case 'rejected':
      case 'cancelled':
        return styles.statusRed;  // Red for both rejected and cancelled
      case 'in-progress':
        return styles.statusBlue;
      default:
        return styles.statusGray;
    }
  };

  const getActionButtonClass = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('approve') || actionLower.includes('accept')) {
      return styles.actionApprove;
    }
    if (actionLower.includes('reject') || actionLower.includes('deny') || actionLower.includes('cancel')) {
      return styles.actionReject;
    }
    if (actionLower.includes('assign') || actionLower.includes('add')) {
      return styles.actionAssign;
    }
    return styles.actionDefault;
  };

  // For collapsible mode, render like ActivityItem with full-width colored background
  if (collapsible) {
    // Determine background color based on status
    const getBgColor = () => {
      switch (status) {
        case 'pending': return '#fef3c7'; // Light yellow - back to original
        case 'in-progress': return '#dbeafe'; // Light blue
        case 'approved': return '#dcfce7'; // Light green
        case 'rejected': return '#fee2e2'; // Light red
        case 'cancelled': return '#fee2e2'; // Light red - same as rejected
        default: return '#f9fafb';
      }
    };

    return (
      <div>
        {/* Colored Header Section - Always visible */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: getBgColor(),
            borderRadius: '6px',
            marginBottom: isExpanded ? '1px' : '8px',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(2px)';
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
            }}>
              {/* Expand/Collapse Arrow */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  color: '#6b7280',
                  flexShrink: 0,
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>

              {/* Order Type Badge */}
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                backgroundColor: '#f3f4f6',  // Gray for both
                color: '#374151',  // Dark gray text
                flexShrink: 0,
              }}>
                {orderType}
              </span>

              {/* Order ID */}
              <span style={{
                fontWeight: 600,
                fontSize: '14px',
                color: '#3b82f6',
                flexShrink: 0,
              }}>
                {orderId}
              </span>

              {/* Title */}
              <span style={{
                fontSize: '14px',
                color: '#6b7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {title}
              </span>
            </div>

            {/* Status Badge */}
            <span className={`${styles.statusBadge} ${getStatusColor(status)}`}>
              {status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Expanded Content - White background */}
        {isExpanded && (
          <div style={{
            marginBottom: '8px',
            padding: '16px',
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
          }}>
            {transformedId && (
              <div style={{
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#15803d',
              }}>
                ✓ Transformed to Service ID: <strong>{transformedId}</strong>
              </div>
            )}

            {/* Order Details Section */}
            <div className={styles.orderDetailsSection}>
              <h4 className={styles.sectionTitle}>Order Details</h4>
              <div className={styles.detailsRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Requested By</span>
                  <span className={styles.detailValue}>{requestedBy}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Center ID</span>
                  <span className={styles.detailValue}>{orderId.split('-')[0]}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date Requested</span>
                  <span className={styles.detailValue}>{requestedDate}</span>
                </div>
                {expectedDate && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Expected By</span>
                    <span className={styles.detailValue}>{expectedDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Workflow Section */}
            {showWorkflow && approvalStages.length > 0 && (
              <div className={styles.approvalWorkflow}>
                <h4 className={styles.workflowTitle}>Approval Workflow</h4>
                <div className={styles.workflowStages}>
                  {approvalStages.map((stage, index) => (
                    <div key={index} className={styles.stageContainer}>
                      <div className={`${styles.stage} ${getStatusColor(stage.status)}`}>
                        <div className={styles.stageRole}>{stage.role}</div>
                        <div className={styles.stageStatus}>
                          {stage.status.replace('-', ' ')}
                        </div>
                        {stage.user && (
                          <div className={styles.stageUser}>{stage.user}</div>
                        )}
                      </div>
                      {index < approvalStages.length - 1 && (
                        <div className={styles.stageArrow}>→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {details && (
              <div style={{ marginBottom: '16px' }}>
                {details}
              </div>
            )}

            {/* Actions Section */}
            {actions.length > 0 && (
              <div className={styles.actionsSection}>
                <h4 className={styles.sectionTitle}>Actions</h4>
                <div className={styles.actions}>
                  {actions.map((action, index) => (
                    <button
                      key={index}
                      className={`${styles.actionButton} ${getActionButtonClass(action)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction?.(action);
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Original card layout (for non-collapsible mode)
  return (
    <div className={styles.orderCard}>
      <div className={styles.cardHeader}>
        <div className={styles.orderInfo}>
          <span className={styles.orderId}>
            {orderId}
          </span>
        </div>
        <span className={`${styles.status} ${getStatusColor(status)}`}>
          {status.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.title}>{title}</h3>

        <div className={styles.metadata}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Requested by:</span>
            <span className={styles.metaValue}>{requestedBy}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Requested:</span>
            <span className={styles.metaValue}>{requestedDate}</span>
          </div>
          {expectedDate && (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Expected:</span>
              <span className={styles.metaValue}>{expectedDate}</span>
            </div>
          )}
        </div>

        {showWorkflow && approvalStages.length > 0 && (
          <div className={styles.approvalWorkflow}>
            <h4 className={styles.workflowTitle}>Approval Workflow</h4>
            <div className={styles.workflowStages}>
              {approvalStages.map((stage, index) => (
                <div key={index} className={styles.stageContainer}>
                  <div className={`${styles.stage} ${getStatusColor(stage.status)}`}>
                    <div className={styles.stageRole}>{stage.role}</div>
                    <div className={styles.stageStatus}>
                      {stage.status.replace('-', ' ')}
                    </div>
                    {stage.user && (
                      <div className={styles.stageUser}>{stage.user}</div>
                    )}
                  </div>
                  {index < approvalStages.length - 1 && (
                    <div className={styles.stageArrow}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {details && (
          <div className={styles.details}>
            {details}
          </div>
        )}

        {actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action, index) => (
              <button
                key={index}
                className={`${styles.actionButton} ${getActionButtonClass(action)}`}
                onClick={() => onAction?.(action)}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderCard;