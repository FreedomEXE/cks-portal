import React, { useState } from 'react';

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
}

interface ReportCardProps {
  report: ReportFeedback;
  currentUser: string;
  userRole: string;
  onAcknowledge?: (reportId: string) => void;
  onResolve?: (reportId: string, actionTaken: string, notes: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  currentUser,
  userRole,
  onAcknowledge,
  onResolve
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
  // Manager/warehouse can only resolve AFTER they've acknowledged
  const canResolve = (userRole === 'manager' || userRole === 'warehouse') && report.status === 'open' && report.type === 'report' && hasAcknowledged;
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

          {/* Status Badge */}
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
          {/* Report Details Section */}
          <div style={{
            marginBottom: '16px',
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
              margin: '0 0 12px 0'
            }}>Report Details</h4>
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
                }}>{report.submittedBy}</span>
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
                }}>{report.submittedDate}</span>
              </div>
              <div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>Category</span>
                <span style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#111827',
                  marginTop: '2px'
                }}>{report.category}</span>
              </div>
              {(report.relatedService || report.relatedOrder) && (
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Related</span>
                  <div style={{ marginTop: '4px' }}>
                    {report.relatedService && (
                      <span style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#3b82f6'
                      }}>Service: {report.relatedService}</span>
                    )}
                    {report.relatedOrder && (
                      <span style={{
                        display: 'block',
                        fontSize: '14px',
                        color: '#3b82f6'
                      }}>Order: {report.relatedOrder}</span>
                    )}
                  </div>
                </div>
              )}
              {report.tags && report.tags.length > 0 && (
                <div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Tags</span>
                  <div style={{
                    marginTop: '2px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {report.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        backgroundColor: 'white',
                        color: '#374151',
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div style={{
            marginBottom: '16px',
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
            }}>Description</h4>
            <p style={{
              margin: '0',
              fontSize: '14px',
              color: '#111827',
              lineHeight: '1.5'
            }}>{report.description}</p>
          </div>


          {/* Acknowledgments Section */}
          {report.acknowledgments.length > 0 && (
            <div style={{
              marginBottom: '16px',
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
              }}>Acknowledged By</h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {report.acknowledgments.map((ack, index) => (
                  <span key={index} style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: 'white',
                    color: '#0369a1',
                    borderRadius: '4px',
                    border: '1px solid #e0f2fe'
                  }}>
                    {ack.userId}
                    {currentUser === ack.userId && <span style={{ fontWeight: 600 }}> (you)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resolved By Section */}
          {report.resolvedBy && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              borderRadius: '6px',
              border: '1px solid #bbf7d0'
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 8px 0'
              }}>Resolved By</h4>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: 'white',
                  color: '#15803d',
                  borderRadius: '4px',
                  border: '1px solid #bbf7d0',
                  fontWeight: 600
                }}>
                  {report.resolvedBy}
                </span>
                {report.resolvedAt && (
                  <span style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    on {new Date(report.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
              {report.resolution_notes && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Resolution Notes</span>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#111827',
                    lineHeight: '1.5'
                  }}>{report.resolution_notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Resolution Section */}
          {report.resolution && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px'
            }}>
              <h4 style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0'
              }}>Resolution</h4>
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#15803d'
                }}>Resolved by {report.resolution.resolvedBy} on {report.resolution.resolvedDate}</span>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Action Taken</span>
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '14px',
                    color: '#111827'
                  }}>{report.resolution.actionTaken}</p>
                </div>
                <div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Notes</span>
                  <p style={{
                    margin: '2px 0 0 0',
                    fontSize: '14px',
                    color: '#111827'
                  }}>{report.resolution.notes}</p>
                </div>
              </div>
            </div>
          )}

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
                <button
                  onClick={handleResolve}
                  disabled={!actionTaken.trim() || !resolutionNotes.trim()}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: actionTaken.trim() && resolutionNotes.trim() ? '#10b981' : '#e5e7eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: actionTaken.trim() && resolutionNotes.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => setIsResolving(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions Section */}
          {(!hasAcknowledged && !isCreator && report.status !== 'closed') || (canResolve && !isResolving && report.type === 'report') ? (
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
                {!hasAcknowledged && !isCreator && report.status !== 'closed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge?.(report.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Acknowledge
                  </button>
                )}

                {canResolve && !isResolving && report.type === 'report' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsResolving(true);
                    }}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Resolve
                  </button>
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