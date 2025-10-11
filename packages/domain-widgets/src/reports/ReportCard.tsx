import React, { useState } from 'react';
import { Button } from '@cks/ui';

// Helper to get user-friendly role name from ID
const getRoleName = (userId: string): string => {
  const prefix = userId.split('-')[0]?.toUpperCase();
  const roleMap: Record<string, string> = {
    'CUS': 'Customer',
    'CEN': 'Center',
    'CON': 'Contractor',
    'CRW': 'Crew',
    'MGR': 'Manager',
    'WHS': 'Warehouse',
    'ADM': 'Administrator'
  };
  return roleMap[prefix] || 'User';
};

// Helper to format date nicely
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper to get category display name
const getCategoryDisplay = (category: string): string => {
  const map: Record<string, string> = {
    'service': 'Service',
    'order': 'Product Order',
    'procedure': 'Procedure'
  };
  return map[category] || category;
};

export interface ReportFeedback {
  id: string;
  type: 'report' | 'feedback';
  category:
    // Report categories
    'Service Quality' | 'Product Quality' | 'Crew Performance' | 'Delivery Issues' | 'System Bug' | 'Safety Concern' |
    // Feedback categories
    'Service Excellence' | 'Staff Performance' | 'Process Improvement' | 'Product Suggestion' | 'System Enhancement' | 'Recognition' |
    // Common
    'Other';
  tags?: string[];
  title: string;
  description: string;
  submittedBy: string;
  submittedDate: string;
  status: 'open' | 'resolved' | 'closed';
  relatedService?: string;
  relatedOrder?: string;
  acknowledgments: Array<{userId: string, date: string}>;
  resolution?: {
    resolvedBy: string;
    resolvedDate: string;
    actionTaken: string;
    notes: string;
  };
  resolution_notes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  // New structured fields
  reportCategory?: string | null;
  relatedEntityId?: string | null;
  reportReason?: string | null;
  // New rating/priority
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  rating?: number | null;
  // Service managed_by (from services table join)
  serviceManagedBy?: string | null;
}

interface ReportCardProps {
  report: ReportFeedback;
  currentUser: string;
  userRole: string;
  onAcknowledge?: (reportId: string) => void;
  onResolve?: (reportId: string, details?: { actionTaken?: string; notes?: string }) => void;
  onViewDetails?: (reportId: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  currentUser,
  userRole,
  onAcknowledge,
  onResolve,
  onViewDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Simplified color scheme
  const getColors = () => {
    if (report.type === 'feedback') {
      return {
        primary: '#10b981', // Green for feedback
        background: '#f0fdf4'
      };
    } else {
      return {
        primary: '#ef4444', // Red for reports
        background: '#fef2f2'
      };
    }
  };

  const colors = getColors();
  const hasAcknowledged = report.acknowledgments.some(ack => ack.userId === currentUser);

  const isWarehouseManaged = (managed?: string | null): boolean => {
    if (!managed) return false;
    const val = managed.toString();
    return val.toLowerCase() === 'warehouse' || val.toUpperCase().startsWith('WHS-');
  };

  // Determine who can resolve based on report category
  const canResolve = (() => {
    if (report.status !== 'open' || report.type !== 'report' || !hasAcknowledged) {
      return false;
    }

    // If structured report, check category-based permissions
    if (report.reportCategory) {
      if (report.reportCategory === 'order') {
        return userRole === 'warehouse'; // Only warehouse resolves order reports
      }
      if (report.reportCategory === 'service') {
        // Service reports: check who manages the service
        if (isWarehouseManaged(report.serviceManagedBy)) {
          return userRole === 'warehouse'; // Warehouse resolves warehouse-managed services
        }
        return userRole === 'manager'; // Manager resolves manager-managed services
      }
      if (report.reportCategory === 'procedure') {
        return userRole === 'manager'; // Only manager resolves procedure reports
      }
    }

    // Fallback for legacy reports without category: both can resolve
    return userRole === 'manager' || userRole === 'warehouse';
  })();

  // Debug: surface permission evaluation inputs/outputs
  console.log('DEBUG canResolve:', {
    userRole,
    reportCategory: report.reportCategory,
    status: report.status,
    type: report.type,
    hasAcknowledged,
    canResolve,
  });

  const isCreator = report.submittedBy === currentUser;

  const handleResolve = () => {
    if (actionTaken.trim() && resolutionNotes.trim()) {
      onResolve?.(report.id, { actionTaken, notes: resolutionNotes });
      setIsResolving(false);
      setActionTaken('');
      setResolutionNotes('');
    }
  };

  // Determine background color like OrderCard
  const getBgColor = () => {
    if (report.type === 'feedback') {
      return '#d1fae5'; // Light green for feedback (same as approved order)
    } else {
      return '#fee2e2'; // Light red for reports (same as rejected order)
    }
  };

  // Get status badge colors that match the card background
  const getStatusBadgeStyle = () => {
    if (report.status === 'open') {
      if (report.type === 'feedback') {
        return {
          backgroundColor: '#10b981', // Green background for open feedback
          color: 'white'
        };
      } else {
        return {
          backgroundColor: '#991b1b', // Dark red background for open reports (matches OrderCard rejected text color)
          color: 'white'
        };
      }
    } else if (report.status === 'resolved') {
      return {
        backgroundColor: '#f59e0b', // Amber/orange for resolved (waiting for acknowledgments)
        color: 'white'
      };
    } else {
      return {
        backgroundColor: '#4b5563', // Gray for closed (matches OrderCard gray text color)
        color: 'white'
      };
    }
  };

  const renderPriorityOrRating = () => {
    if (report.type === 'report' && report.priority) {
      const color = report.priority === 'HIGH' ? '#b91c1c' : report.priority === 'MEDIUM' ? '#f59e0b' : '#059669';
      const bg = report.priority === 'HIGH' ? '#fee2e2' : report.priority === 'MEDIUM' ? '#fef3c7' : '#ecfdf5';
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          color,
          backgroundColor: bg,
          border: `1px solid ${color}33`,
          flexShrink: 0,
        }}>
          {report.priority} Priority
        </span>
      );
    }
    if (report.type === 'feedback' && report.rating && report.rating > 0) {
      const full = '★★★★★'.slice(0, Math.min(5, report.rating));
      const empty = '☆☆☆☆☆'.slice(0, 5 - Math.min(5, report.rating));
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#92400e',
          backgroundColor: '#fffbeb',
          border: '1px solid #fcd34d',
          flexShrink: 0,
        }}>
          {full}{empty}
        </span>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Colored Header Section - Exactly like OrderCard */}
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
            {/* Expand/Collapse Arrow - Exact SVG from OrderCard */}
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

            {/* Type Badge */}
            <span style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              backgroundColor: colors.primary,
              color: 'white',
              flexShrink: 0,
            }}>
              {report.type}
            </span>

            {/* Report/Feedback ID */}
            <span style={{
              fontWeight: 600,
              fontSize: '14px',
              color: '#6b7280',
              flexShrink: 0,
            }}>
              {report.id}
            </span>

            {/* Title */}
            <span style={{
              fontSize: '14px',
              color: '#6b7280',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {report.title}
            </span>
          </div>

          {/* Status Badge + Priority/Rating */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              flexShrink: 0,
              ...getStatusBadgeStyle(),
            }}>
              {report.status}
            </span>
            {renderPriorityOrRating()}
          </div>
        </div>
      </div>

      {/* Expanded Content - White background with border like OrderCard */}
      {isExpanded && (
        <div style={{
          marginBottom: '8px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          {/* Simple Summary - Just the essentials */}
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Submitted By</span>
                <span style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#111827',
                  marginTop: '2px'
                }}>{getRoleName(report.submittedBy)} ({report.submittedBy})</span>
              </div>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Date</span>
                <span style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#111827',
                  marginTop: '2px'
                }}>{formatDate(report.submittedDate)}</span>
              </div>
              {report.reportCategory && (
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Type</span>
                  <span style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#111827',
                    marginTop: '2px'
                  }}>{getCategoryDisplay(report.reportCategory)}</span>
                </div>
              )}
              {report.relatedEntityId && (
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Related To</span>
                  <span style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#3b82f6',
                    marginTop: '2px',
                    fontWeight: 500
                  }}>{report.relatedEntityId}</span>
                </div>
              )}
              {report.reportReason && (
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Issue</span>
                  <span style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#111827',
                    marginTop: '2px',
                    fontWeight: 600
                  }}>{report.reportReason}</span>
                </div>
              )}
              {report.status === 'resolved' && report.resolvedBy && (
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Resolved By</span>
                  <span style={{
                    display: 'block',
                    fontSize: '14px',
                    color: '#15803d',
                    marginTop: '2px',
                    fontWeight: 600
                  }}>{report.resolvedBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resolution Form */}
          {isResolving && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '6px'
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0'
              }}>Resolve Report</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                    Action Taken ({actionTaken.length}/100)
                  </label>
                  <input
                    type="text"
                    value={actionTaken}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setActionTaken(e.target.value);
                      }
                    }}
                    placeholder="Brief description (max 100 chars)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                    Resolution Notes ({resolutionNotes.length}/300)
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setResolutionNotes(e.target.value);
                      }
                    }}
                    placeholder="Detailed notes (max 300 chars)"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={handleResolve}
                  disabled={!actionTaken.trim() || !resolutionNotes.trim()}
                  variant="primary"
                  size="md"
                  roleColor="#10b981"
                >
                  Mark as Resolved
                </Button>
                <Button
                  onClick={() => setIsResolving(false)}
                  variant="secondary"
                  size="md"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions Section */}
          {(!hasAcknowledged && !isCreator && report.status !== 'closed') || (canResolve && !isResolving && report.type === 'report') || onViewDetails ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px'
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 8px 0'
              }}>Actions</h4>
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                {onViewDetails && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(report.id);
                    }}
                    variant="primary"
                    size="md"
                    roleColor="#6b7280"
                  >
                    View Details
                  </Button>
                )}

                {!hasAcknowledged && !isCreator && report.status !== 'closed' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge?.(report.id);
                    }}
                    variant="primary"
                    size="md"
                    roleColor="#3b82f6"
                  >
                    Acknowledge
                  </Button>
                )}

                {canResolve && !isResolving && report.type === 'report' && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsResolving(true);
                    }}
                    variant="primary"
                    size="md"
                    roleColor="#10b981"
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ReportCard;
