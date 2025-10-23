import React, { useEffect, useState } from 'react';
import Button from '../../buttons/Button';
import { ModalRoot } from '../ModalRoot';
import { ArchivedBanner } from '../../banners/ArchivedBanner';
import { DeletedBanner } from '../../banners/DeletedBanner';

// Lifecycle interface (matches frontend types)
interface Lifecycle {
  state: 'active' | 'archived' | 'deleted';
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  scheduledDeletion?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  isTombstone?: boolean;
}

export interface ServiceDetails {
  serviceId: string;
  title?: string | null;
  centerId?: string | null;
  metadata: any;
}

export interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDetails | null;
  editable?: boolean;
  onSave?: (updates: { crew?: string[]; procedures?: any[]; training?: any[]; notes?: string }) => void;
  onSendCrewRequest?: (crewCodes: string[]) => Promise<void>;
  availableCrew?: Array<{ code: string; name: string }>;
  onStartService?: () => void;
  onCompleteService?: () => void;
  onCancelService?: () => void;
  serviceStatus?: string; // 'created', 'in_progress', 'completed', 'cancelled'
  serviceType?: string; // 'one-time', 'ongoing'
  productOrders?: Array<{ orderId: string; productName: string; quantity: number; status: string; requestedDate?: string }>;
  // NEW: Universal lifecycle support
  lifecycle?: Lifecycle;
  entityType?: string;
  entityId?: string;
  actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }>;
}

export default function ServiceDetailsModal({
  isOpen,
  onClose,
  service,
  editable = true,
  onSave,
  onSendCrewRequest,
  availableCrew = [],
  onStartService,
  onCompleteService,
  onCancelService,
  serviceStatus = 'created',
  serviceType = 'one-time',
  productOrders = [],
  lifecycle,
  entityType = 'service',
  entityId,
  actions = []
}: ServiceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'crew' | 'products' | 'procedures' | 'training' | 'notes'>('overview');
  const [crewSelected, setCrewSelected] = useState<string[]>([]);
  const [pendingCrewRequests, setPendingCrewRequests] = useState<string[]>([]);
  const [proceduresInput, setProceduresInput] = useState('');
  const [trainingInput, setTrainingInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [showCrewPicker, setShowCrewPicker] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    if (!isOpen || !service) return;
    const meta = service.metadata || {};
    const crewArr: string[] = Array.isArray(meta.crew) ? meta.crew : [];
    const proceduresArr: any[] = Array.isArray(meta.procedures) ? meta.procedures : [];
    const trainingArr: any[] = Array.isArray(meta.training) ? meta.training : [];

    // Extract crew requests from metadata
    const crewRequests: Array<{crewCode: string; status: string}> = Array.isArray(meta.crewRequests) ? meta.crewRequests : [];
    const acceptedCrew = crewRequests.filter(r => r.status === 'accepted').map(r => r.crewCode);
    const pendingCrew = crewRequests.filter(r => r.status === 'pending').map(r => r.crewCode);

    setCrewSelected(acceptedCrew);
    setPendingCrewRequests(pendingCrew);
    setProceduresInput(proceduresArr.map((p: any) => p?.name || '').filter(Boolean).join('\n'));
    setTrainingInput(trainingArr.map((t: any) => t?.name || '').filter(Boolean).join('\n'));
    setNotesInput(meta.notes || '');
    setActiveTab('overview');
    setShowCrewPicker(false);
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const handleSave = () => {
    if (!onSave) return;
    const procedures = proceduresInput.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    const training = trainingInput.split('\n').map(s => s.trim()).filter(Boolean).map(name => ({ name }));
    onSave({ crew: crewSelected, procedures, training, notes: notesInput });
  };

  const handleRemoveCrew = (code: string) => {
    setCrewSelected(prev => prev.filter(c => c !== code));
  };

  const getStatusBadge = () => {
    const colors: Record<string, { bg: string; text: string }> = {
      created: { bg: '#dbeafe', text: '#1e40af' },
      in_progress: { bg: '#fef3c7', text: '#92400e' },
      completed: { bg: '#d1fae5', text: '#065f46' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' }
    };
    const color = colors[serviceStatus] || colors.created;
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: color.bg,
        color: color.text,
        textTransform: 'capitalize'
      }}>
        {serviceStatus.replace('_', ' ')}
      </span>
    );
  };

  const TabButton = ({ tab, label }: { tab: typeof activeTab; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: '8px 16px',
        border: 'none',
        borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
        background: 'none',
        color: activeTab === tab ? '#3b82f6' : '#6b7280',
        fontWeight: activeTab === tab ? 600 : 400,
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      {label}
    </button>
  );

  return (
    <ModalRoot isOpen={isOpen} onClose={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 0, width: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: 24, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{service.title || service.serviceId}</h2>
              <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, color: '#6b7280' }}>
                <span><strong>ID:</strong> {service.serviceId}</span>
                <span>|</span>
                <span><strong>Center:</strong> {service.centerId || 'N/A'}</span>
                <span>|</span>
                <span><strong>Type:</strong> {serviceType === 'ongoing' ? 'Ongoing' : 'One-Time'}</span>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {serviceStatus === 'created' && onStartService && (
              <Button variant="primary" onClick={() => { onStartService(); onClose(); }}>
                Start Service
              </Button>
            )}
            {serviceStatus === 'in_progress' && onCompleteService && (
              <Button variant="primary" onClick={() => { onCompleteService(); onClose(); }}>
                Complete Service
              </Button>
            )}
            {(serviceStatus === 'created' || serviceStatus === 'in_progress') && onCancelService && (
              <Button variant="danger" onClick={() => {
                const reason = window.prompt('Please provide a reason for cancellation:');
                if (reason) {
                  onCancelService();
                  onClose();
                }
              }}>
                Cancel Service
              </Button>
            )}
          </div>
        </div>

        {/* UNIVERSAL LIFECYCLE BANNER - renders for ANY entity */}
        {lifecycle && lifecycle.state !== 'active' && (
          <div style={{ padding: '0 24px', marginTop: 16 }}>
            {lifecycle.state === 'archived' && (
              <ArchivedBanner
                archivedAt={lifecycle.archivedAt}
                archivedBy={lifecycle.archivedBy}
                reason={lifecycle.archiveReason}
                scheduledDeletion={lifecycle.scheduledDeletion}
                entityType={entityType}
                entityId={entityId || service.serviceId}
              />
            )}
            {lifecycle.state === 'deleted' && (
              <DeletedBanner
                deletedAt={lifecycle.deletedAt}
                deletedBy={lifecycle.deletedBy}
                entityType={entityType}
                entityId={entityId || service.serviceId}
                isTombstone={lifecycle.isTombstone}
              />
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 8, paddingLeft: 24 }}>
          <TabButton tab="overview" label="Overview" />
          <TabButton tab="crew" label="Crew" />
          <TabButton tab="products" label="Products" />
          <TabButton tab="procedures" label="Procedures" />
          <TabButton tab="training" label="Training" />
          <TabButton tab="notes" label="Notes" />
        </div>

        {/* Tab Content */}
        <div style={{ padding: 24, flex: 1, overflowY: 'auto', minHeight: 200 }}>
          {activeTab === 'overview' && (
            <div>
              <p style={{ color: '#6b7280', marginTop: 0 }}>Service information and quick summary.</p>
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Assigned Crew:</strong>
                  <span style={{ color: '#6b7280' }}>{crewSelected.length > 0 ? crewSelected.join(', ') : 'No crew assigned'}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Procedures:</strong>
                  <span style={{ color: '#6b7280' }}>{proceduresInput ? proceduresInput.split('\n').length + ' procedure(s)' : 'None'}</span>
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Training:</strong>
                  <span style={{ color: '#6b7280' }}>{trainingInput ? trainingInput.split('\n').length + ' training(s)' : 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crew' && (
            <div>
              {/* Assigned Crew Section */}
              {crewSelected.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: 0, fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Assigned Crew:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {crewSelected.map(code => {
                      const crewInfo = availableCrew.find(c => c.code === code);
                      return (
                        <div key={code} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          backgroundColor: '#d1fae5',
                          border: '1px solid #10b981',
                          borderRadius: 6
                        }}>
                          <span style={{ fontWeight: 500, color: '#065f46' }}>
                            {crewInfo?.name || code} ({code})
                          </span>
                          {editable && (
                            <Button size="sm" variant="danger" onClick={() => handleRemoveCrew(code)}>Remove</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending Requests Section */}
              {pendingCrewRequests.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: 0, fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Pending Requests:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingCrewRequests.map(code => {
                      const crewInfo = availableCrew.find(c => c.code === code);
                      return (
                        <div key={code} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 12,
                          backgroundColor: '#fef3c7',
                          border: '1px solid #f59e0b',
                          borderRadius: 6
                        }}>
                          <span style={{ fontWeight: 500, color: '#92400e' }}>
                            {crewInfo?.name || code} ({code}) - Waiting for response
                          </span>
                          {editable && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setPendingCrewRequests(prev => prev.filter(c => c !== code));
                                  alert('✓ Request cancelled. You can now send a new request to this crew member.');
                                }}
                              >
                                Cancel Request
                              </Button>
                              {onSendCrewRequest && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={async () => {
                                    setSendingRequest(true);
                                    try {
                                      await onSendCrewRequest([code]);
                                      alert('✓ Request resent successfully!');
                                    } catch (err) {
                                      alert('Failed to resend request. Please try again.');
                                    } finally {
                                      setSendingRequest(false);
                                    }
                                  }}
                                  disabled={sendingRequest}
                                >
                                  {sendingRequest ? 'Resending...' : 'Resend Request'}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Crew Section */}
              {editable && !!onSendCrewRequest && !showCrewPicker && (
                <div style={{ marginBottom: 16 }}>
                  <Button size="sm" onClick={() => setShowCrewPicker(true)}>Request Crew</Button>
                </div>
              )}

              {showCrewPicker && !!onSendCrewRequest && (
                <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <h4 style={{ marginTop: 0, fontSize: 14, marginBottom: 12 }}>Select crew members to request:</h4>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, maxHeight: 240, overflowY: 'auto', backgroundColor: '#fff' }}>
                    {availableCrew.length === 0 ? (
                      <div style={{ color: '#6b7280' }}>No crew available in your ecosystem.</div>
                    ) : (
                      availableCrew
                        .filter(c => !crewSelected.includes(c.code) && !pendingCrewRequests.includes(c.code))
                        .map((c) => (
                          <label key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                            <input
                              type="checkbox"
                              checked={crewSelected.includes(c.code)}
                              onChange={(e) => {
                                const checked = e.currentTarget.checked;
                                setCrewSelected((prev) => checked ? [...prev, c.code] : prev.filter(x => x !== c.code));
                              }}
                            />
                            <span style={{ fontSize: 14 }}>{c.name} ({c.code})</span>
                          </label>
                        ))
                    )}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        if (!onSendCrewRequest || crewSelected.length === 0) {
                          setShowCrewPicker(false);
                          return;
                        }
                        setSendingRequest(true);
                        try {
                          await onSendCrewRequest(crewSelected);
                          setPendingCrewRequests(prev => [...prev, ...crewSelected]);
                          setCrewSelected([]);
                          setShowCrewPicker(false);
                          alert('✓ Crew requests sent successfully!');
                        } catch (err) {
                          alert('Failed to send crew requests. Please try again.');
                        } finally {
                          setSendingRequest(false);
                        }
                      }}
                      disabled={sendingRequest || crewSelected.length === 0}
                    >
                      {sendingRequest ? 'Sending...' : `Send Request${crewSelected.length > 0 ? ` (${crewSelected.length})` : ''}`}
                    </Button>
                    <Button size="sm" onClick={() => { setShowCrewPicker(false); setCrewSelected([]); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {crewSelected.length === 0 && pendingCrewRequests.length === 0 && !showCrewPicker && (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 16 }}>No crew assigned or requested yet.</p>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
                Products and supplies ordered for this service.
              </p>

              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <Button size="sm" onClick={() => window.open('/catalog?mode=products', '_blank')}>
                  Request Products
                </Button>
              </div>

              {productOrders && productOrders.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Order ID</th>
                        <th style={{ padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Product</th>
                        <th style={{ padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Quantity</th>
                        <th style={{ padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '8px 0', color: '#6b7280', fontWeight: 600 }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productOrders.map((order, idx) => (
                        <tr key={order.orderId || idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 0', color: '#111827', fontFamily: 'monospace', fontSize: 13 }}>{order.orderId}</td>
                          <td style={{ padding: '12px 0', color: '#111827' }}>{order.productName}</td>
                          <td style={{ padding: '12px 0', color: '#111827' }}>{order.quantity}</td>
                          <td style={{ padding: '12px 0' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: order.status.toLowerCase() === 'delivered' ? '#dcfce7' :
                                              order.status.toLowerCase() === 'pending' ? '#fef3c7' : '#dbeafe',
                              color: order.status.toLowerCase() === 'delivered' ? '#166534' :
                                     order.status.toLowerCase() === 'pending' ? '#92400e' : '#1e3a8a'
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 0', color: '#6b7280', fontSize: 13 }}>
                            {order.requestedDate ? new Date(order.requestedDate).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 16 }}>
                  No products ordered for this service yet.
                </p>
              )}
            </div>
          )}

          {activeTab === 'procedures' && (
            <div>
              <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
                Standard operating procedures linked to this service. Full procedure management coming post-MVP.
              </p>

              {proceduresInput && proceduresInput.trim() ? (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Linked Procedures:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {proceduresInput.split('\n').filter(p => p.trim()).map((proc, idx) => (
                      <div key={idx} style={{
                        padding: 12,
                        backgroundColor: '#f9fafb',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 14 }}>{proc}</span>
                        {editable && (
                          <Button size="sm" variant="danger" onClick={() => {
                            const procs = proceduresInput.split('\n').filter(p => p.trim());
                            procs.splice(idx, 1);
                            setProceduresInput(procs.join('\n'));
                          }}>Remove</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 16 }}>No procedures linked yet.</p>
              )}

              {editable && (
                <div style={{ marginTop: 16 }}>
                  <Button size="sm" onClick={() => alert('Procedure library coming post-MVP. For now, you can manually add procedure names in the backend.')}>
                    Link Procedure
                  </Button>
                </div>
              )}

              <div style={{ marginTop: 24, padding: 12, backgroundColor: '#fef3c7', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                <strong>Post-MVP:</strong> Full procedure management with drag-and-drop builder, task breakdowns, crew assignments, and reusable templates.
              </div>
            </div>
          )}

          {activeTab === 'training' && (
            <div>
              <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>
                Training materials and certifications required for this service. Full training management coming post-MVP.
              </p>

              {trainingInput && trainingInput.trim() ? (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Linked Training:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {trainingInput.split('\n').filter(t => t.trim()).map((training, idx) => (
                      <div key={idx} style={{
                        padding: 12,
                        backgroundColor: '#f9fafb',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 14 }}>{training}</span>
                        {editable && (
                          <Button size="sm" variant="danger" onClick={() => {
                            const trainings = trainingInput.split('\n').filter(t => t.trim());
                            trainings.splice(idx, 1);
                            setTrainingInput(trainings.join('\n'));
                          }}>Remove</Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', marginTop: 16 }}>No training linked yet.</p>
              )}

              {editable && (
                <div style={{ marginTop: 16 }}>
                  <Button size="sm" onClick={() => alert('Training library coming post-MVP. For now, you can manually add training materials in the backend.')}>
                    Link Training
                  </Button>
                </div>
              )}

              <div style={{ marginTop: 24, padding: 12, backgroundColor: '#fef3c7', borderRadius: 6, fontSize: 13, color: '#92400e' }}>
                <strong>Post-MVP:</strong> Full training management with video uploads, PDF attachments, certification tracking, expiration dates, and crew completion status.
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <p style={{ color: '#6b7280', marginTop: 0, fontSize: 14 }}>Additional notes and context for this service.</p>
              <textarea
                disabled={!editable}
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="Enter notes..."
                rows={10}
                style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 14 }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 24, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={onClose}>Close</Button>
          {editable && <Button variant="primary" onClick={handleSave}>Save Changes</Button>}
        </div>
      </div>
    </ModalRoot>
  );
}
