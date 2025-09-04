/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Home.tsx (Admin Hub - FULLY INDEPENDENT)
 * 
 * Description: Consolidated admin hub with complete independence from shared components
 * Function: Single-page admin interface with tabbed sections for system management
 * Importance: Critical - Central administration for all CKS Portal operations
 * Connects to: Admin API endpoints only, Admin authentication, sessionStorage
 * 
 * Notes: 100% self-contained admin hub with no external dependencies.
 *        Admin is the only non-template hub that creates data for all other hubs.
 *        Includes user creation, system management, and directory functionality.
 *        Uses black theme for administrative authority and system control.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { validateAdminRole, getAdminSession, setAdminSession, getAdminOperationalInfo } from './utils/adminAuth';
import { buildAdminApiUrl, adminApiFetch } from './utils/adminApi';

// Admin Support Section Component
function AdminSupportSection() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [responseText, setResponseText] = useState<string>('');
  const [sending, setSending] = useState(false);

  // Load support tickets and stats
  useEffect(() => {
    loadSupportData();
  }, [filterStatus, filterPriority]);

  async function loadSupportData() {
    try {
      setLoading(true);
      // Capture created ID for optional Clerk invite
      try {
        let createdId = '';
        if (createRole === 'manager') createdId = js?.data?.manager_id || '';
        else if (createRole === 'contractor') createdId = js?.data?.contractor_id || '';
        else if (createRole === 'customer') createdId = js?.data?.customer_id || '';
        else if (createRole === 'center') createdId = js?.data?.center_id || '';
        else if (createRole === 'crew') createdId = js?.data?.crew_id || '';
        else if (createRole === 'warehouse') createdId = js?.data?.warehouse_id || '';
        if (createdId) {
          setLastCreated({ role: createRole, id: createdId, email: (createPayload as any)?.email });
        }
      } catch {}

      
      // Build query params
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority !== 'all') params.append('priority', filterPriority);
      
      const [ticketsResponse, statsResponse] = await Promise.all([
        adminApiFetch(`/api/support/tickets?${params.toString()}`),
        adminApiFetch(`/api/support/stats`)
      ]);
      
      if (ticketsResponse.ok && statsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        const statsData = await statsResponse.json();
        
        setTickets(ticketsData.data || []);
        setStats(statsData.data || {});
      }
    } catch (error) {
      console.error('Failed to load support data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load individual ticket details
  async function loadTicketDetails(ticketId: string) {
    try {
      const response = await adminApiFetch(`/api/support/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.data.ticket);
        setTicketMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load ticket details:', error);
    }
  }

  // Send response to ticket
  async function sendResponse() {
    if (!selectedTicket || !responseText.trim()) return;
    
    try {
      setSending(true);
      
      const response = await adminApiFetch(`/api/support/tickets/${selectedTicket.ticket_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_type: 'admin',
          sender_id: 'freedom_exe',
          sender_name: 'Admin Support',
          message: responseText
        })
      });
      
      if (response.ok) {
        setResponseText('');
        loadTicketDetails(selectedTicket.ticket_id); // Reload messages
        loadSupportData(); // Reload tickets list
      }
    } catch (error) {
      console.error('Failed to send response:', error);
    } finally {
      setSending(false);
    }
  }

  // Update ticket status
  async function updateTicketStatus(ticketId: string, status: string) {
    try {
      const response = await adminApiFetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        loadSupportData();
        if (selectedTicket?.ticket_id === ticketId) {
          loadTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'investigating': return '#f59e0b';
      case 'waiting_user': return '#8b5cf6';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Support Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
          🎧 Technical Support Center
        </h2>
        <p style={{ color: '#888888', fontSize: 14 }}>
          Manage app-related support requests from all hub users. Help users resolve technical issues, bugs, and usage questions.
        </p>
      </div>

      {/* Support Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#ef4444', fontSize: 24, fontWeight: 700 }}>{stats.overview?.open_tickets || 0}</div>
          <div style={{ color: '#ffffff', fontSize: 14 }}>Open Tickets</div>
        </div>
        <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 24, fontWeight: 700 }}>{stats.overview?.investigating_tickets || 0}</div>
          <div style={{ color: '#ffffff', fontSize: 14 }}>Investigating</div>
        </div>
        <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#8b5cf6', fontSize: 24, fontWeight: 700 }}>{stats.overview?.high_priority || 0}</div>
          <div style={{ color: '#ffffff', fontSize: 14 }}>High Priority</div>
        </div>
        <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 8, padding: 16 }}>
          <div style={{ color: '#10b981', fontSize: 24, fontWeight: 700 }}>{stats.overview?.tickets_today || 0}</div>
          <div style={{ color: '#ffffff', fontSize: 14 }}>Today</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Tickets List */}
        <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, margin: 0 }}>Support Tickets</h3>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12 }}>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select 
                value={filterPriority} 
                onChange={(e) => setFilterPriority(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', fontSize: 12 }}
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>No support tickets found</div>
          ) : (
            <div style={{ maxHeight: 600, overflowY: 'auto' }}>
              {tickets.map((ticket: any) => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => loadTicketDetails(ticket.ticket_id)}
                  style={{
                    padding: 16,
                    border: '1px solid #333333',
                    borderRadius: 8,
                    marginBottom: 12,
                    cursor: 'pointer',
                    background: selectedTicket?.ticket_id === ticket.ticket_id ? '#222' : '#000',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ color: '#ffffff', fontSize: 14, fontWeight: 600 }}>{ticket.subject}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>
                        {ticket.ticket_id} • {ticket.user_id} ({ticket.user_hub})
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        background: getPriorityColor(ticket.priority),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {ticket.priority}
                      </span>
                      <span style={{
                        background: getStatusColor(ticket.status),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: '#aaa', fontSize: 12 }}>
                    {ticket.issue_type} • {ticket.message_count} messages • {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ticket Details */}
        {selectedTicket && (
          <div style={{ background: '#111111', border: '1px solid #333333', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ color: '#ffffff', fontSize: 18, fontWeight: 600, margin: '0 0 8px 0' }}>
                  {selectedTicket.subject}
                </h3>
                <div style={{ color: '#888', fontSize: 12 }}>
                  {selectedTicket.ticket_id} • {selectedTicket.user_id} • {selectedTicket.user_hub} hub
                </div>
              </div>
              
              {/* Status Update Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTicket.status !== 'investigating' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.ticket_id, 'investigating')}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Mark Investigating
                  </button>
                )}
                {selectedTicket.status !== 'resolved' && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.ticket_id, 'resolved')}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: 16 }}>
              {ticketMessages.map((message: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 8,
                    background: message.sender_type === 'admin' ? '#1a365d' : '#2d1b69',
                    border: `1px solid ${message.sender_type === 'admin' ? '#2563eb' : '#7c3aed'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#ffffff', fontSize: 12, fontWeight: 600 }}>
                      {message.sender_name || message.sender_id}
                    </span>
                    <span style={{ color: '#aaa', fontSize: 10 }}>
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 13, lineHeight: 1.4 }}>
                    {message.message}
                  </div>
                </div>
              ))}
            </div>

            {/* Response Input */}
            <div>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response to help the user..."
                style={{
                  width: '100%',
                  height: 80,
                  background: '#000',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 13,
                  resize: 'vertical'
                }}
              />
              <button
                onClick={sendResponse}
                disabled={!responseText.trim() || sending}
                style={{
                  background: responseText.trim() ? '#2563eb' : '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: responseText.trim() ? 'pointer' : 'not-allowed',
                  marginTop: 8
                }}
              >
                {sending ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UnifiedUserCreateForm({ 
  handleCreateUser, 
  creating, 
  createMsg, 
  setCreateMsg, 
  createPayload, 
  setCreatePayload, 
  createRole, 
  setCreateRole 
}: {
  handleCreateUser: () => void;
  creating: boolean;
  createMsg: string | null;
  setCreateMsg: (msg: string | null) => void;
  createPayload: Record<string, any>;
  setCreatePayload: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  createRole: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse';
  setCreateRole: (role: 'manager' | 'contractor' | 'customer' | 'center' | 'crew' | 'warehouse') => void;
}) {
  const userTypes = [
    {
      role: 'contractor' as const,
      label: 'Contractor',
      icon: '🏢',
      color: '#10b981',
      description: 'Create new contractor company'
    },
    {
      role: 'manager' as const,
      label: 'Manager', 
      icon: '👨‍💼',
      color: '#3b82f6',
      description: 'Create new CKS manager'
    },
    {
      role: 'customer' as const,
      label: 'Customer',
      icon: '🎯',
      color: '#eab308',
      description: 'Create new customer company'
    },
    {
      role: 'center' as const,
      label: 'Center',
      icon: '🏬',
      color: '#f97316',
      description: 'Create new service center'
    },
    {
      role: 'crew' as const,
      label: 'Crew',
      icon: '👷',
      color: '#ef4444',
      description: 'Create new crew member'
    },
    {
      role: 'warehouse' as const,
      label: 'Warehouse',
      icon: '🏭',
      color: '#8b5cf6',
      description: 'Create new warehouse hub'
    }
  ];

  const currentUserType = userTypes.find(type => type.role === createRole) || userTypes[0];

  const handleUserTypeChange = (role: typeof createRole) => {
    setCreateRole(role);
    setCreatePayload({});
    setCreateMsg(null);
  };

  const renderField = (key: string, label: string, type: 'text' | 'email' | 'date' | 'number' = 'text', placeholder?: string) => {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>{label}</label>
        <input
          type={type}
          value={(createPayload as any)[key] || ''}
          onChange={(e) => {
            const value = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
            setCreatePayload(prev => ({ ...prev, [key]: value }));
          }}
          placeholder={placeholder}
          style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}
        />
      </div>
    );
  };

  const renderSelectField = (key: string, label: string, options: { value: string, label: string }[]) => {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>{label}</label>
        <select
          value={(createPayload as any)[key] || ''}
          onChange={(e) => setCreatePayload(prev => ({ ...prev, [key]: e.target.value }))}
          style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}
        >
          <option value="">Select...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderFormFields = () => {
    switch (createRole) {
      case 'manager':
        return (
          <>
            {renderField('manager_name', 'Manager Name')}
            {renderField('address', 'Address')}
            {renderField('phone', 'Phone')}
            {renderField('email', 'Email', 'email')}
            {renderField('territory', 'Territory', 'text', 'e.g., GTA, Downtown, etc.')}
            {renderField('reports_to', 'Reports To', 'text', 'e.g., CEO, Senior Manager, etc.')}
            {renderField('role', 'Role/Position', 'text', 'e.g., Backend Manager, Operations Manager, etc.')}
          </>
        );
      
      case 'contractor':
        return (
          <>
            {renderField('company_name', 'Company Name')}
            {renderField('address', 'Address')}
            {renderField('contact_person', 'Main Contact')}
            {renderField('phone', 'Phone')}
            {renderField('email', 'Email', 'email')}
            {renderField('website', 'Website')}
          </>
        );
      
      case 'customer':
        return (
          <>
            {renderField('company_name', 'Company Name')}
            {renderField('contact_person', 'Contact Person')}
            {renderField('email', 'Email', 'email')}
            {renderField('phone', 'Phone')}
            {renderSelectField('cks_manager', 'Assigned Manager', [
              { value: 'mgr-000', label: 'MGR-000 (Template Manager)' },
              { value: 'mgr-001', label: 'MGR-001 (Operations Manager)' },
              { value: 'mgr-002', label: 'MGR-002 (Regional Manager)' }
            ])}
          </>
        );
      
      case 'center':
        return (
          <>
            {renderField('center_name', 'Center Name')}
            {renderField('customer_id', 'Customer ID', 'text', 'CUS-XXX')}
            {renderField('contractor_id', 'Contractor ID', 'text', 'CON-XXX')}
            {renderField('address', 'Address')}
            {renderSelectField('cks_manager', 'Assigned Manager', [
              { value: 'mgr-000', label: 'MGR-000 (Template Manager)' },
              { value: 'mgr-001', label: 'MGR-001 (Operations Manager)' },
              { value: 'mgr-002', label: 'MGR-002 (Regional Manager)' }
            ])}
          </>
        );
      
      case 'warehouse':
        return (
          <>
            {renderField('warehouse_name', 'Warehouse Name')}
            {renderField('address', 'Address')}
            {renderField('warehouse_type', 'Type')}
            {renderField('phone', 'Phone')}
            {renderField('email', 'Email', 'email')}
            {renderField('date_acquired', 'Date Acquired', 'date')}
            {renderField('capacity', 'Capacity', 'number')}
            {renderSelectField('status', 'Status', [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' }
            ])}
          </>
        );
      
      case 'crew':
        return (
          <CrewCreateWizard
            payload={createPayload}
            setPayload={setCreatePayload}
            onCreate={handleCreateUser}
            creating={creating}
            message={createMsg}
          />
        );
      
      default:
        return null;
    }
  };

  if (createRole === 'crew') {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>Create Users</div>
          <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>
            Create and provision all types of CKS Portal users
          </div>
        </div>

        {/* User Type Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 8 }}>Select User Type</label>
          <select
            value={createRole}
            onChange={(e) => handleUserTypeChange(e.target.value as any)}
            style={{ 
              width: '100%', 
              background: '#000', 
              color: '#fff', 
              border: '1px solid #333', 
              padding: '12px 16px', 
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600
            }}
          >
            {userTypes.map(type => (
              <option key={type.role} value={type.role}>
                {type.icon} {type.label} - {type.description}
              </option>
            ))}
          </select>
        </div>

        {renderFormFields()}
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#ffffff' }}>Create Users</div>
        <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>
          Create and provision all types of CKS Portal users
        </div>
      </div>

      {/* User Type Selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ color: '#aaa', fontSize: 13, display: 'block', marginBottom: 8 }}>Select User Type</label>
        <select
          value={createRole}
          onChange={(e) => handleUserTypeChange(e.target.value as any)}
          style={{ 
            width: '100%', 
            background: '#000', 
            color: '#fff', 
            border: '1px solid #333', 
            padding: '12px 16px', 
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {userTypes.map(type => (
            <option key={type.role} value={type.role}>
              {type.icon} {type.label} - {type.description}
            </option>
          ))}
        </select>
      </div>

      {/* Form Container */}
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 20, 
          padding: '12px 16px', 
          background: `${currentUserType.color}20`, 
          borderRadius: 8,
          border: `1px solid ${currentUserType.color}40`
        }}>
          <span style={{ fontSize: 24 }}>{currentUserType.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
              Create {currentUserType.label}
            </div>
            <div style={{ fontSize: 12, color: '#888888' }}>
              {currentUserType.description}
            </div>
          </div>
        </div>

        {renderFormFields()}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button 
            onClick={handleCreateUser} 
            disabled={creating} 
            style={{ 
              padding: '12px 24px', 
              background: creating ? '#666' : `linear-gradient(135deg, ${currentUserType.color} 0%, ${currentUserType.color}cc 100%)`, 
              border: 'none', 
              color: currentUserType.color === '#eab308' ? '#000000' : '#ffffff', 
              borderRadius: 8, 
              fontWeight: 600, 
              cursor: creating ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {creating ? 'Creating…' : `Create ${currentUserType.label}`}
          </button>
          {createMsg && (
            <div style={{ 
              fontSize: 13,
              color: createMsg.includes('✅') || createMsg.includes('successfully') ? '#22c55e' : '#f59e0b',
              padding: '8px 12px',
              background: '#0a0a0a',
              borderRadius: 6
            }}>
              {createMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrainingProceduresSection() {
  const [activeType, setActiveType] = useState<'training' | 'procedures'>('training');
  
  return (
    <div>
      {/* Toggle between Training and Procedures */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>Create Training & Procedures</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveType('training')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${activeType === 'training' ? '#f59e0b' : '#444444'}`,
              background: activeType === 'training' ? '#f59e0b' : '#222222',
              color: activeType === 'training' ? '#000000' : '#f59e0b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎓 Create Training
          </button>
          <button
            onClick={() => setActiveType('procedures')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${activeType === 'procedures' ? '#f59e0b' : '#444444'}`,
              background: activeType === 'procedures' ? '#f59e0b' : '#222222',
              color: activeType === 'procedures' ? '#000000' : '#f59e0b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📋 Create Procedure
          </button>
        </div>
      </div>
      
      {/* Render the appropriate form */}
      {activeType === 'training' ? <CreateTrainingCard /> : <CreateProcedureCard />}
    </div>
  );
}

function ProductsSuppliesSection() {
  const [activeType, setActiveType] = useState<'products' | 'supplies'>('products');
  
  return (
    <div>
      {/* Toggle between Products and Supplies */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>Create Products & Supplies</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveType('products')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${activeType === 'products' ? '#ec4899' : '#444444'}`,
              background: activeType === 'products' ? '#ec4899' : '#222222',
              color: activeType === 'products' ? '#000000' : '#ec4899',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📦 Create Product
          </button>
          <button
            onClick={() => setActiveType('supplies')}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: `1px solid ${activeType === 'supplies' ? '#ec4899' : '#444444'}`,
              background: activeType === 'supplies' ? '#ec4899' : '#222222',
              color: activeType === 'supplies' ? '#000000' : '#ec4899',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📋 Create Supply
          </button>
        </div>
      </div>
      
      {/* Render the appropriate form */}
      {activeType === 'products' ? <CreateProductCard /> : <CreateSupplyCard />}
    </div>
  );
}

function CreateProductCard() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      // TODO: Implement API call for product creation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMsg('Product created successfully!');
      // Reset form
      setName(''); setCategory(''); setDescription(''); setUnit(''); setPrice('');
    } catch (e) {
      setMsg('Failed to create product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ 
      background: '#1a1a1a', 
      border: '1px solid #333333', 
      borderRadius: 12, 
      padding: 20,
      maxWidth: 500
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>📦 New Product</div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Product Name *</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name..."
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Category</div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        >
          <option value="">Select category...</option>
          <option value="tools">Tools</option>
          <option value="materials">Materials</option>
          <option value="equipment">Equipment</option>
          <option value="safety">Safety</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description..."
          rows={3}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14, resize: 'vertical' }}
        />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Unit</div>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
          >
            <option value="">Select unit...</option>
            <option value="piece">Piece</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="kg">Kilogram</option>
            <option value="liter">Liter</option>
            <option value="meter">Meter</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Price</div>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Status</div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      
      <button 
        onClick={onSave} 
        disabled={saving || !name} 
        style={{ 
          width: '100%', 
          padding: '12px 16px', 
          background: '#ec4899', 
          border: 'none', 
          borderRadius: 8, 
          color: '#000', 
          fontWeight: 700, 
          cursor: 'pointer', 
          fontSize: 14 
        }}
      >
        {saving ? 'Creating…' : 'CREATE PRODUCT'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateSupplyCard() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      // TODO: Implement API call for supply creation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setMsg('Supply created successfully!');
      // Reset form
      setName(''); setCategory(''); setDescription(''); setSupplier(''); setUnit(''); setCost('');
    } catch (e) {
      setMsg('Failed to create supply');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ 
      background: '#1a1a1a', 
      border: '1px solid #333333', 
      borderRadius: 12, 
      padding: 20,
      maxWidth: 500
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#ffffff' }}>📋 New Supply</div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Supply Name *</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter supply name..."
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Category</div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        >
          <option value="">Select category...</option>
          <option value="office">Office Supplies</option>
          <option value="maintenance">Maintenance</option>
          <option value="cleaning">Cleaning</option>
          <option value="safety">Safety</option>
          <option value="consumables">Consumables</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Description</div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Supply description..."
          rows={3}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14, resize: 'vertical' }}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Supplier</div>
        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        >
          <option value="">Select supplier...</option>
          <option value="supplier-001">ABC Supply Co.</option>
          <option value="supplier-002">CKS Materials</option>
          <option value="supplier-003">Industrial Solutions</option>
          <option value="supplier-004">Office Depot</option>
          <option value="other">Other</option>
        </select>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Unit</div>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
          >
            <option value="">Select unit...</option>
            <option value="piece">Piece</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="roll">Roll</option>
            <option value="bottle">Bottle</option>
            <option value="case">Case</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Cost</div>
          <input
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
          />
        </div>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#cccccc' }}>Status</div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          style={{ width: '100%', padding: '8px 12px', background: '#000000', border: '1px solid #444444', borderRadius: 6, color: '#ffffff', fontSize: 14 }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      
      <button 
        onClick={onSave} 
        disabled={saving || !name} 
        style={{ 
          width: '100%', 
          padding: '12px 16px', 
          background: '#ec4899', 
          border: 'none', 
          borderRadius: 8, 
          color: '#000', 
          fontWeight: 700, 
          cursor: 'pointer', 
          fontSize: 14 
        }}
      >
        {saving ? 'Creating…' : 'CREATE SUPPLY'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateServiceCard() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/catalog/items');
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category, description, status }) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Service created');
      setName(''); setCategory(''); setDescription(''); setStatus('active');
    } catch (e) {
      setMsg('Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🔧 Create Service</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a new service to the global catalog</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Category</label>
        <input value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 100 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !name} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE SERVICE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateWarehouseCard() {
  const [warehouse_name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [manager_id, setManagerId] = useState('');
  const [warehouse_type, setType] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date_acquired, setDateAcquired] = useState('');
  const [capacity, setCapacity] = useState<number | ''>('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const body = { warehouse_name, address, manager_id, warehouse_type, phone, email, date_acquired: date_acquired || undefined, capacity: capacity || undefined, status };
      const r = await adminApiFetch(buildAdminApiUrl('/warehouses'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Warehouse created');
      setName(''); setAddress(''); setManagerId(''); setType(''); setPhone(''); setEmail(''); setDateAcquired(''); setCapacity(''); setStatus('active');
    } catch {
      setMsg('Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🏭 Create Warehouse</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Provision a new warehouse hub</div>
      {[
        { label: 'Name', value: warehouse_name, setter: setName },
        { label: 'Address', value: address, setter: setAddress },
        { label: 'Manager ID (MGR-XXX)', value: manager_id, setter: setManagerId },
        { label: 'Type', value: warehouse_type, setter: setType },
        { label: 'Phone', value: phone, setter: setPhone },
        { label: 'Email', value: email, setter: setEmail },
      ].map((f) => (
        <div key={f.label} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>{f.label}</label>
          <input value={f.value as any} onChange={(e)=>f.setter(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Date Acquired</label>
        <input type="date" value={date_acquired} onChange={(e)=>setDateAcquired(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Capacity</label>
        <input type="number" value={capacity} onChange={(e)=>setCapacity(e.target.value === '' ? '' : Number(e.target.value))} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !warehouse_name} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE WAREHOUSE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

// New Bucket-Based Assignment System Components

// Individual User Card Component
function UserCard({ user, userType, isSelected, onSelect, onDelete }: any) {
  const getId = () => {
    switch(userType) {
      case 'contractors': return user.contractor_id;
      case 'customers': return user.customer_id;
      case 'centers': return user.center_id;
      case 'crew': return user.crew_id;
      case 'warehouses': return user.warehouse_id;
      default: return user.id;
    }
  };

  const getName = () => {
    switch(userType) {
      case 'contractors': return user.company_name;
      case 'customers': return user.company_name;
      case 'centers': return user.center_name || user.name;
      case 'crew': return user.crew_name;
      case 'warehouses': return user.warehouse_name;
      default: return user.name;
    }
  };

  const handleCardClick = (e: any) => {
    // Don't trigger selection if delete button was clicked
    if (e.target.closest('.delete-button')) return;
    onSelect();
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${getName()} (${getId()})?`)) {
      onDelete(getId());
    }
  };

  return (
    <div style={{
      border: '1px solid #333',
      borderRadius: 8,
      padding: 12,
      background: isSelected ? '#1a365d' : '#0a0a0a',
      transition: 'all 0.2s',
      cursor: 'pointer'
    }} onClick={handleCardClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onSelect}
          style={{ accentColor: '#3b82f6' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{getName()}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{getId()}</div>
          {user.status && (
            <div style={{ 
              fontSize: 10, 
              color: user.status === 'active' ? '#10b981' : '#f59e0b',
              marginTop: 4
            }}>
              {user.status.toUpperCase()}
            </div>
          )}
        </div>
        <button
          className="delete-button"
          onClick={handleDelete}
          style={{
            background: '#dc2626',
            border: 'none',
            borderRadius: 6,
            color: 'white',
            padding: '6px 8px',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'background 0.2s',
            opacity: 0.8
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Unassigned Bucket Component
function UnassignedBucket({ title, userType, users, selectedUsers, onSelectUser, onSelectAll, onDelete, loading }: any) {
  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0;

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #333333',
      borderRadius: 12,
      padding: 20,
      color: '#ffffff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#888' }}>({users.length})</div>
      </div>
      
      {loading && (
        <div style={{ color: '#888', fontSize: 14, padding: 20, textAlign: 'center' }}>
          Loading...
        </div>
      )}
      
      {!loading && users.length === 0 && (
        <div style={{ color: '#666', fontSize: 14, padding: 20, textAlign: 'center' }}>
          No unassigned {userType}
        </div>
      )}
      
      {!loading && users.length > 0 && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 12, 
              color: '#aaa',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={onSelectAll}
                style={{ accentColor: '#3b82f6' }}
              />
              Select All
            </label>
          </div>
          
          <div style={{ display: 'grid', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {users.map((user: any) => {
              const userId = user.contractor_id || user.customer_id || user.center_id || user.crew_id || user.warehouse_id;
              return (
                <UserCard
                  key={userId}
                  user={user}
                  userType={userType}
                  isSelected={selectedUsers.includes(userId)}
                  onSelect={() => onSelectUser(userId)}
                  onDelete={onDelete}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Smart Assignment Panel Component
function SmartAssignmentPanel({ selectedUsers, userTypes, onAssign, isAssigning }: any) {
  const [assignmentTarget, setAssignmentTarget] = useState('');
  const [assignmentTargetType, setAssignmentTargetType] = useState('');
  const [availableTargets, setAvailableTargets] = useState<any[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Get valid assignment targets based on user types selected
  const getValidTargetTypes = () => {
    const validTargets = new Set();
    userTypes.forEach((type: string) => {
      switch(type) {
        case 'contractors':
          validTargets.add('managers');
          break;
        case 'customers':
          validTargets.add('contractors');
          break;
        case 'centers':
          validTargets.add('customers');
          break;
        case 'crew':
          validTargets.add('managers');
          break;
        case 'warehouses':
          validTargets.add('managers');
          break;
      }
    });
    return Array.from(validTargets);
  };

  const validTargetTypes = getValidTargetTypes();

  // Load available targets when target type changes
  useEffect(() => {
    if (!assignmentTargetType) {
      setAvailableTargets([]);
      return;
    }

    const loadTargets = async () => {
      setLoadingTargets(true);
      try {
        const endpoint = assignmentTargetType === 'managers' ? '/managers' : `/${assignmentTargetType}`;
        const res = await adminApiFetch(buildAdminApiUrl(endpoint, { limit: 100 }));
        const data = await res.json();
        setAvailableTargets(data.items || []);
      } catch (error) {
        console.error('Failed to load targets:', error);
        setAvailableTargets([]);
      } finally {
        setLoadingTargets(false);
      }
    };

    loadTargets();
  }, [assignmentTargetType]);

  const totalSelected = Object.values(selectedUsers).reduce((sum: number, arr: any) => sum + arr.length, 0);

  if (totalSelected === 0) return null;

  return (
    <div style={{
      background: '#1a365d',
      border: '1px solid #2563eb',
      borderRadius: 12,
      padding: 20,
      color: '#ffffff',
      position: 'sticky',
      top: 20
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Assign Selected Users ({totalSelected})
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#bbb', marginBottom: 4 }}>Assignment Target Type</div>
        <select
          value={assignmentTargetType}
          onChange={(e) => {
            setAssignmentTargetType(e.target.value);
            setAssignmentTarget('');
          }}
          style={{
            width: '100%',
            background: '#0a0a0a',
            color: '#fff',
            border: '1px solid #333',
            padding: '8px 10px',
            borderRadius: 6
          }}
        >
          <option value="">Select target type...</option>
          {validTargetTypes.map(targetType => (
            <option key={targetType} value={targetType}>
              {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
            </option>
          ))}
        </select>
      </div>
      
      {assignmentTargetType && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#bbb', marginBottom: 4 }}>Select Target</div>
          <select
            value={assignmentTarget}
            onChange={(e) => setAssignmentTarget(e.target.value)}
            disabled={loadingTargets}
            style={{
              width: '100%',
              background: '#0a0a0a',
              color: '#fff',
              border: '1px solid #333',
              padding: '8px 10px',
              borderRadius: 6,
              opacity: loadingTargets ? 0.5 : 1
            }}
          >
            <option value="">Select target...</option>
            {availableTargets.map(target => {
              const id = target.manager_id || target.contractor_id || target.customer_id || target.id;
              const name = target.manager_name || target.company_name || target.name;
              return (
                <option key={id} value={id}>
                  {id} - {name}
                </option>
              );
            })}
          </select>
        </div>
      )}
      
      <button
        onClick={() => onAssign(assignmentTarget, assignmentTargetType)}
        disabled={!assignmentTarget || isAssigning}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: assignmentTarget ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#444',
          border: 'none',
          borderRadius: 8,
          color: '#ffffff',
          fontWeight: 600,
          cursor: assignmentTarget && !isAssigning ? 'pointer' : 'not-allowed',
          fontSize: 14,
          opacity: assignmentTarget && !isAssigning ? 1 : 0.5
        }}
      >
        {isAssigning ? 'Assigning...' : 'ASSIGN SELECTED'}
      </button>
    </div>
  );
}

// Simplified Assignment System with Dropdown Selection
function SimplifiedAssignmentSystem() {
  const [selectedUserType, setSelectedUserType] = useState<string>('contractors');
  const [unassignedUsers, setUnassignedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  // Manager assignment state
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState('');

  const userTypeOptions = [
    { value: 'contractors', label: 'Unassigned - Contractors', icon: '🏢' },
    { value: 'customers', label: 'Unassigned - Customers', icon: '🏷️' },  
    { value: 'centers', label: 'Unassigned - Centers', icon: '🏢' },
    { value: 'crew', label: 'Unassigned - Crew', icon: '👥' },
    { value: 'warehouses', label: 'Unassigned - Warehouses', icon: '🏭' }
  ];

  // Load unassigned users for selected type
  useEffect(() => {
    loadUnassignedUsers();
  }, [selectedUserType]);

  const loadUnassignedUsers = async () => {
    setLoading(true);
    setSelectedUsers([]);
    setMessage(null);
    
    try {
      let response;
      switch (selectedUserType) {
        case 'crew':
          response = await adminApiFetch(buildAdminApiUrl('/crew/unassigned'));
          break;
        case 'contractors':
          response = await adminApiFetch(buildAdminApiUrl('/contractors', { limit: 100 }));
          const contractorsData = await response.json();
          setUnassignedUsers((contractorsData.items || []).filter((c: any) => !c.cks_manager));
          setLoading(false);
          return;
        case 'customers':
          response = await adminApiFetch(buildAdminApiUrl('/customers', { limit: 100 }));
          const customersData = await response.json();
          setUnassignedUsers((customersData.items || []).filter((c: any) => !c.cks_manager));
          setLoading(false);
          return;
        case 'centers':
          response = await adminApiFetch(buildAdminApiUrl('/centers', { limit: 100 }));
          const centersData = await response.json();
          setUnassignedUsers((centersData.items || []).filter((c: any) => !c.customer_id));
          setLoading(false);
          return;
        case 'warehouses':
          response = await adminApiFetch(buildAdminApiUrl('/warehouses', { limit: 100 }));
          const warehousesData = await response.json();
          setUnassignedUsers((warehousesData.items || []).filter((w: any) => !w.manager_id));
          setLoading(false);
          return;
        default:
          setUnassignedUsers([]);
          setLoading(false);
          return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUnassignedUsers(data.items || []);
      }
    } catch (error) {
      console.error('Failed to load unassigned users:', error);
      setMessage('Failed to load unassigned users');
      setUnassignedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUserIds = unassignedUsers.map(user => getUserId(user));
    setSelectedUsers(selectedUsers.length === allUserIds.length ? [] : allUserIds);
  };

  const getUserId = (user: any) => {
    return user.contractor_id || user.customer_id || user.center_id || user.crew_id || user.warehouse_id;
  };

  const getUserName = (user: any) => {
    return user.company_name || user.contractor_name || user.customer_name || user.center_name || 
           user.crew_name || user.warehouse_name || `${user.first_name} ${user.last_name}`.trim() || 
           getUserId(user);
  };

  // Load manager options when assigning contractors
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const res = await adminApiFetch(buildAdminApiUrl('/managers', { limit: 100 }));
        const js = await res.json();
        setManagers(Array.isArray(js.items) ? js.items : []);
      } catch {
        setManagers([]);
      }
    };
    if (selectedUserType === 'contractors' && selectedUsers.length > 0) {
      loadManagers();
    }
  }, [selectedUserType, selectedUsers.length]);

  async function assignContractorsToManager() {
    try {
      if (!selectedManager) {
        setMessage('Please select a manager');
        return;
      }
      for (const contractorId of selectedUsers) {
        const r = await adminApiFetch(buildAdminApiUrl(`/contractors/${contractorId}/assign-manager`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manager_id: selectedManager })
        });
        if (!r.ok) {
          const j = await r.json().catch(()=>({}));
          throw new Error(j?.details || j?.error || `Failed to assign ${contractorId}`);
        }
      }
      setMessage(`Assigned ${selectedUsers.length} contractor(s) to ${selectedManager}`);
      setSelectedUsers([]);
      setSelectedManager('');
      await loadUnassignedUsers();
    } catch (e: any) {
      setMessage(`Assignment failed: ${e?.message || e}`);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {message && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: message.includes('Failed') ? '#dc2626' : '#16a34a',
          color: '#fff',
          fontSize: 14
        }}>
          {message}
        </div>
      )}
      
      {/* User Type Selection */}
      <div style={{ 
        background: '#111111', 
        border: '1px solid #333333', 
        borderRadius: 12, 
        padding: 20,
        color: '#ffffff'
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          📋 Select Unassigned User Type
        </div>
        <div style={{ marginBottom: 16 }}>
          <select
            value={selectedUserType}
            onChange={(e) => setSelectedUserType(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '12px 16px',
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {userTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>
          Select a user type to view and assign unassigned users from that category.
        </div>
      </div>

      {/* Users List */}
      <div style={{
        background: '#111111',
        border: '1px solid #333333', 
        borderRadius: 12,
        color: '#ffffff'
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid #333333' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {userTypeOptions.find(opt => opt.value === selectedUserType)?.icon} {' '}
                {userTypeOptions.find(opt => opt.value === selectedUserType)?.label} ({unassignedUsers.length})
              </div>
              <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
                Select users to assign to appropriate roles
              </div>
            </div>
            {unassignedUsers.length > 0 && (
              <button
                onClick={handleSelectAll}
                style={{
                  padding: '8px 16px',
                  background: '#333333',
                  border: '1px solid #555555',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {selectedUsers.length === unassignedUsers.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888888' }}>
              Loading unassigned {selectedUserType}...
            </div>
          ) : unassignedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888888' }}>
              No unassigned {selectedUserType} found
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {unassignedUsers.map((user) => {
                const userId = getUserId(user);
                const isSelected = selectedUsers.includes(userId);
                
                return (
                  <div
                    key={userId}
                    onClick={() => handleUserSelect(userId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 16,
                      background: isSelected ? '#1f2937' : '#0a0a0a',
                      border: `1px solid ${isSelected ? '#3b82f6' : '#333333'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Handled by div onClick
                      style={{ width: 16, height: 16 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{getUserName(user)}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{userId}</div>
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${getUserName(user)} (${userId})?`)) {
                          const map: any = { contractors: 'contractors', customers: 'customers', centers: 'centers', crew: 'crew', warehouses: 'warehouses' };
                          const t = map[selectedUserType];
                          if (t) {
                            handleDeleteUser(t, userId);
                          }
                        }
                      }}
                      style={{
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        padding: '6px 8px',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment Actions */}
        {selectedUsers.length > 0 && (
          <div style={{ padding: 20, borderTop: '1px solid #333333' }}>
            {selectedUserType === 'contractors' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ fontSize: 14 }}>
                  Assign {selectedUsers.length} contractor(s) to:
                </div>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #333333',
                    borderRadius: 6,
                    color: '#ffffff',
                    minWidth: 260
                  }}
                >
                  <option value="">Select manager...</option>
                  {managers.map((m:any) => (
                    <option key={m.manager_id} value={m.manager_id}>
                      {m.manager_id} - {m.manager_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={assignContractorsToManager}
                  disabled={!selectedManager}
                  style={{
                    padding: '10px 16px',
                    background: selectedManager ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#444',
                    border: 'none',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: selectedManager ? 'pointer' : 'not-allowed'
                  }}
                >
                  Assign to Manager
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Select Contractors to assign them to a Manager.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Main Bucket Assignment System
function BucketAssignmentSystem() {
  const [unassignedData, setUnassignedData] = useState({
    contractors: [],
    customers: [],
    centers: [],
    crew: [],
    warehouses: []
  });
  
  const [selectedUsers, setSelectedUsers] = useState({
    contractors: [],
    customers: [],
    centers: [],
    crew: [],
    warehouses: []
  });
  
  const [loading, setLoading] = useState({
    contractors: false,
    customers: false,
    centers: false,
    crew: false,
    warehouses: false
  });
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load unassigned users for all types
  useEffect(() => {
    const loadUnassignedData = async () => {
      setLoading({
        contractors: true,
        customers: true,
        centers: true,
        crew: true,
        warehouses: true
      });

      try {
        const requests = [
          // Use existing unassigned crew endpoint
          adminApiFetch(buildAdminApiUrl('/crew/unassigned')),
          // For others, we'll need to filter by null assignment fields
          adminApiFetch(buildAdminApiUrl('/contractors', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/customers', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/centers', { limit: 100 })),
          adminApiFetch(buildAdminApiUrl('/warehouses', { limit: 100 }))
        ];

        const responses = await Promise.all(requests);
        const [crewData, contractorsData, customersData, centersData, warehousesData] = 
          await Promise.all(responses.map(r => r.json()));

        // Filter unassigned users based on assignment fields
        const unassignedContractors = (contractorsData.items || []).filter((c: any) => !c.cks_manager);
        const unassignedCustomers = (customersData.items || []).filter((c: any) => !c.cks_manager);
        const unassignedCenters = (centersData.items || []).filter((c: any) => !c.customer_id);
        const unassignedWarehouses = (warehousesData.items || []).filter((w: any) => !w.manager_id);

        setUnassignedData({
          contractors: unassignedContractors,
          customers: unassignedCustomers,
          centers: unassignedCenters,
          crew: crewData.items || [],
          warehouses: unassignedWarehouses
        });
      } catch (error) {
        console.error('Failed to load unassigned data:', error);
        setMessage('Failed to load unassigned users');
      } finally {
        setLoading({
          contractors: false,
          customers: false,
          centers: false,
          crew: false,
          warehouses: false
        });
      }
    };

    loadUnassignedData();
  }, []);

  const handleSelectUser = (userType: string, userId: string) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userType]: prev[userType as keyof typeof prev].includes(userId)
        ? prev[userType as keyof typeof prev].filter((id: string) => id !== userId)
        : [...prev[userType as keyof typeof prev], userId]
    }));
  };

  const handleSelectAll = (userType: string) => {
    const allUsers = unassignedData[userType as keyof typeof unassignedData];
    const currentSelected = selectedUsers[userType as keyof typeof selectedUsers];
    const allUserIds = allUsers.map((user: any) => 
      user.contractor_id || user.customer_id || user.center_id || user.crew_id || user.warehouse_id
    );

    setSelectedUsers(prev => ({
      ...prev,
      [userType]: currentSelected.length === allUsers.length ? [] : allUserIds
    }));
  };

  const handleDeleteUser = async (userType: string, userId: string) => {
    try {
      let endpoint = '';
      switch(userType) {
        case 'contractors':
          endpoint = `/contractors/${userId}`;
          break;
        case 'customers':
          endpoint = `/customers/${userId}`;
          break;
        case 'centers':
          endpoint = `/centers/${userId}`;
          break;
        case 'crew':
          endpoint = `/crew/${userId}`;
          break;
        case 'warehouses':
          endpoint = `/warehouses/${userId}`;
          break;
        default:
          throw new Error(`Unsupported user type: ${userType}`);
      }

      const response = await adminApiFetch(buildAdminApiUrl(endpoint), {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove the user from local state
        setUnassignedData(prev => ({
          ...prev,
          [userType]: prev[userType as keyof typeof prev].filter((user: any) => {
            const currentUserId = user.contractor_id || user.customer_id || user.center_id || user.crew_id || user.warehouse_id;
            return currentUserId !== userId;
          })
        }));

        // Remove from selected users if it was selected
        setSelectedUsers(prev => ({
          ...prev,
          [userType]: prev[userType as keyof typeof prev].filter((id: string) => id !== userId)
        }));

        setMessage(`${userType.slice(0, -1).toUpperCase()} ${userId} deleted successfully`);
      } else {
        const errorData = await response.json();
        setMessage(`Failed to delete ${userType.slice(0, -1)}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Failed to delete ${userType}:`, error);
      setMessage(`Failed to delete ${userType.slice(0, -1)}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAssign = async (targetId: string, targetType: string) => {
    setIsAssigning(true);
    setMessage(null);

    try {
      // Get all selected users across all types
      const allSelectedUsers = Object.entries(selectedUsers)
        .filter(([_, users]) => users.length > 0)
        .map(([userType, userIds]) => ({ userType, userIds }));

      // Contractors -> Managers
      if (targetType === 'managers' && allSelectedUsers.some(({ userType }) => userType === 'contractors')) {
        const contractors = selectedUsers.contractors;
        for (const contractorId of contractors) {
          const res = await adminApiFetch(buildAdminApiUrl(`/contractors/${contractorId}/assign-manager`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manager_id: targetId })
          });
          if (!res.ok) {
            const j = await res.json().catch(()=>({}));
            throw new Error(j?.error || `Failed to assign ${contractorId}`);
          }
        }
        // Remove from local unassigned list
        setUnassignedData(prev => ({
          ...prev,
          contractors: prev.contractors.filter((c:any) => !contractors.includes(c.contractor_id))
        }));
        setSelectedUsers(prev => ({ ...prev, contractors: [] }));
      }

      // For now, we'll implement crew assignment as it's already available
      // TODO: Implement other assignment types when backend endpoints are ready
      if (allSelectedUsers.some(({ userType }) => userType === 'crew')) {
        const selectedCrew = selectedUsers.crew;
        for (const crewId of selectedCrew) {
          const res = await adminApiFetch(buildAdminApiUrl(`/crew/${crewId}/assign-center`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              center_id: targetId,
              force_assign: true // Admin override for bulk operations
            })
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Assignment failed');
          }
        }
      }

      setMessage(`Successfully assigned ${Object.values(selectedUsers).flat().length} users`);
      
      // Clear selections
      setSelectedUsers({
        contractors: [],
        customers: [],
        centers: [],
        crew: [],
        warehouses: []
      });
      
      // Reload unassigned data
      await loadUnassignedData();
      
    } catch (error: any) {
      setMessage(`Assignment failed: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const getSelectedUserTypes = () => {
    return Object.entries(selectedUsers)
      .filter(([_, users]) => users.length > 0)
      .map(([userType, _]) => userType);
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {message && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: message.includes('failed') || message.includes('Failed') ? '#dc2626' : '#16a34a',
          color: '#fff',
          fontSize: 14
        }}>
          {message}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Unassigned Buckets */}
        <UnassignedBucket
          title="🏢 Unassigned Contractors"
          userType="contractors"
          users={unassignedData.contractors}
          selectedUsers={selectedUsers.contractors}
          onSelectUser={(userId: string) => handleSelectUser('contractors', userId)}
          onSelectAll={() => handleSelectAll('contractors')}
          onDelete={(userId: string) => handleDeleteUser('contractors', userId)}
          loading={loading.contractors}
        />
        
        <UnassignedBucket
          title="🏷️ Unassigned Customers"
          userType="customers"
          users={unassignedData.customers}
          selectedUsers={selectedUsers.customers}
          onSelectUser={(userId: string) => handleSelectUser('customers', userId)}
          onSelectAll={() => handleSelectAll('customers')}
          onDelete={(userId: string) => handleDeleteUser('customers', userId)}
          loading={loading.customers}
        />
        
        <UnassignedBucket
          title="🏢 Unassigned Centers"
          userType="centers"
          users={unassignedData.centers}
          selectedUsers={selectedUsers.centers}
          onSelectUser={(userId: string) => handleSelectUser('centers', userId)}
          onSelectAll={() => handleSelectAll('centers')}
          onDelete={(userId: string) => handleDeleteUser('centers', userId)}
          loading={loading.centers}
        />
        
        <UnassignedBucket
          title="👥 Unassigned Crew"
          userType="crew"
          users={unassignedData.crew}
          selectedUsers={selectedUsers.crew}
          onSelectUser={(userId: string) => handleSelectUser('crew', userId)}
          onSelectAll={() => handleSelectAll('crew')}
          onDelete={(userId: string) => handleDeleteUser('crew', userId)}
          loading={loading.crew}
        />
        
        <UnassignedBucket
          title="🏭 Unassigned Warehouses"
          userType="warehouses"
          users={unassignedData.warehouses}
          selectedUsers={selectedUsers.warehouses}
          onSelectUser={(userId: string) => handleSelectUser('warehouses', userId)}
          onSelectAll={() => handleSelectAll('warehouses')}
          onDelete={(userId: string) => handleDeleteUser('warehouses', userId)}
          loading={loading.warehouses}
        />
        
        {/* Smart Assignment Panel */}
        <SmartAssignmentPanel
          selectedUsers={selectedUsers}
          userTypes={getSelectedUserTypes()}
          onAssign={handleAssign}
          isAssigning={isAssigning}
        />
      </div>
    </div>
  );
}

// Legacy Crew Assignment Component (preserved for comparison)
function LegacyCrewAssignmentCard() {
  const [unassignedCrew, setUnassignedCrew] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<string>('');
  const [selectedCenter, setSelectedCenter] = useState<string>('');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [showRequirements, setShowRequirements] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [forceAssign, setForceAssign] = useState(false);

  // Load unassigned crew and centers
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [crewRes, centersRes] = await Promise.all([
          adminApiFetch(buildAdminApiUrl('/crew/unassigned')),
          adminApiFetch(buildAdminApiUrl('/centers', { limit: 100 }))
        ]);
        const [crewData, centersData] = await Promise.all([crewRes.json(), centersRes.json()]);
        setUnassignedCrew(crewData.items || []);
        setCenters(centersData.items || []);
      } catch (error) {
        setMessage('Failed to load data');
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Load requirements when crew is selected
  useEffect(() => {
    if (!selectedCrew) {
      setRequirements([]);
      setShowRequirements(false);
      return;
    }
    async function loadRequirements() {
      try {
        const res = await adminApiFetch(buildAdminApiUrl(`/crew/${selectedCrew}/requirements`));
        const data = await res.json();
        setRequirements(data.items || []);
        setShowRequirements(true);
      } catch (error) {
        setRequirements([]);
      }
    }
    loadRequirements();
  }, [selectedCrew]);

  const handleAssign = async () => {
    if (!selectedCrew || !selectedCenter) {
      setMessage('Please select both crew member and center');
      return;
    }

    setAssigning(true);
    setMessage(null);
    try {
      const res = await adminApiFetch(buildAdminApiUrl(`/crew/${selectedCrew}/assign-center`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          center_id: selectedCenter,
          force_assign: forceAssign
        })
      });

      if (res.status === 400) {
        const error = await res.json();
        if (error.error_code === 'REQUIREMENTS_INCOMPLETE') {
          setMessage(`❌ Incomplete requirements (${error.requirements_status.completed}/${error.requirements_status.total}). Check "Force Assign" to override.`);
        } else {
          setMessage(`❌ ${error.error}`);
        }
        setAssigning(false);
        return;
      }

      const result = await res.json();
      setMessage(`✅ ${result.message}`);
      
      // Refresh unassigned crew list
      const crewRes = await adminApiFetch(buildAdminApiUrl('/crew/unassigned'));
      const crewData = await crewRes.json();
      setUnassignedCrew(crewData.items || []);
      
      // Reset selections
      setSelectedCrew('');
      setSelectedCenter('');
      setForceAssign(false);
      
    } catch (error) {
      setMessage('❌ Assignment failed');
    }
    setAssigning(false);
  };

  const selectedCrewData = unassignedCrew.find(c => c.crew_id === selectedCrew);
  const readinessColor = selectedCrewData?.is_ready ? '#22c55e' : '#f59e0b';

  return (
    <div style={{
      background: '#111111',
      border: '1px solid #333333',
      borderRadius: 12,
      padding: 20,
      color: '#ffffff',
      minWidth: 400
    }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Crew → Center Assignment</div>
      <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
        Assign unassigned crew members to centers with readiness checks
      </div>

      {loading && <div style={{ color: '#888', fontSize: 14 }}>Loading...</div>}
      
      {!loading && (
        <>
          {/* Crew Selection */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#aaa' }}>
              Unassigned Crew ({unassignedCrew.length})
            </label>
            <select 
              value={selectedCrew}
              onChange={(e) => setSelectedCrew(e.target.value)}
              style={{ 
                width: '100%', 
                background: '#000', 
                color: '#fff', 
                border: '1px solid #333', 
                padding: '8px 10px', 
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">Select crew member...</option>
              {unassignedCrew.map(crew => (
                <option key={crew.crew_id} value={crew.crew_id}>
                  {crew.crew_name} ({crew.crew_id}) - {crew.readiness_score}% ready
                </option>
              ))}
            </select>
          </div>

          {/* Center Selection */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#aaa' }}>
              Target Center
            </label>
            <select 
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              style={{ 
                width: '100%', 
                background: '#000', 
                color: '#fff', 
                border: '1px solid #333', 
                padding: '8px 10px', 
                borderRadius: 6,
                fontSize: 14
              }}
            >
              <option value="">Select center...</option>
              {centers.map(center => (
                <option key={center.center_id} value={center.center_id}>
                  {center.name || center.center_name} ({center.center_id})
                </option>
              ))}
            </select>
          </div>

          {/* Readiness Status */}
          {selectedCrewData && (
            <div style={{ 
              marginBottom: 12, 
              padding: 10, 
              background: '#0a0a0a', 
              borderRadius: 6,
              border: `1px solid ${readinessColor}20`
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>Readiness Status</div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 14 
              }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: readinessColor 
                }}></div>
                <span style={{ color: readinessColor, fontWeight: 600 }}>
                  {selectedCrewData.readiness_score}% Complete
                </span>
                <span style={{ color: '#888' }}>
                  ({selectedCrewData.completed_requirements}/{selectedCrewData.total_requirements} requirements)
                </span>
              </div>
            </div>
          )}

          {/* Requirements Details */}
          {showRequirements && requirements.length > 0 && (
            <div style={{ 
              marginBottom: 12, 
              padding: 10, 
              background: '#0a0a0a', 
              borderRadius: 6,
              maxHeight: 120,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 6 }}>Requirements</div>
              {requirements.map((req, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  marginBottom: 4,
                  fontSize: 12
                }}>
                  <div style={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    background: req.status === 'completed' ? '#22c55e' : '#f59e0b'
                  }}></div>
                  <span style={{ color: req.required ? '#fff' : '#888' }}>
                    {req.title} ({req.kind})
                  </span>
                  <span style={{ 
                    fontSize: 10,
                    color: req.status === 'completed' ? '#22c55e' : '#f59e0b',
                    textTransform: 'uppercase'
                  }}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Force Assign Override */}
          {selectedCrewData && !selectedCrewData.is_ready && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: 13,
                color: '#f59e0b',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={forceAssign} 
                  onChange={(e) => setForceAssign(e.target.checked)}
                />
                Force Assign (Admin Override)
              </label>
            </div>
          )}

          {/* Assignment Button */}
          <button 
            onClick={handleAssign}
            disabled={!selectedCrew || !selectedCenter || assigning}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: selectedCrewData?.is_ready || forceAssign 
                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              fontWeight: 600,
              cursor: (!selectedCrew || !selectedCenter || assigning) ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: (!selectedCrew || !selectedCenter || assigning) ? 0.5 : 1
            }}
          >
            {assigning ? 'Assigning...' : selectedCrewData?.is_ready ? 'ASSIGN TO CENTER' : 'ASSIGN WITH OVERRIDE'}
          </button>

          {message && (
            <div style={{ 
              marginTop: 12, 
              fontSize: 13, 
              color: message.includes('✅') ? '#22c55e' : '#f59e0b',
              padding: 8,
              background: '#0a0a0a',
              borderRadius: 4
            }}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CrewCreateWizard({ payload, setPayload, onCreate, creating, message }: { payload: Record<string, any>, setPayload: React.Dispatch<React.SetStateAction<Record<string, any>>>, onCreate: () => void, creating: boolean, message: string | null }) {
  const [step, setStep] = useState(0);
  const steps = ['Identity', 'Contact', 'Employment', 'Skills & Certs', 'Emergency'];

  function setField(k: string, v: any) { setPayload(prev => ({ ...prev, [k]: v })); }
  function next() { if (step < steps.length - 1) setStep(step + 1); }
  function back() { if (step > 0) setStep(step - 1); }

  // Minimal validation per step
  const canNext = () => {
    if (step === 0) return Boolean((payload.crew_name || '').trim());
    return true;
  };

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 16, color: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <span key={s} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: i === step ? '#22c55e' : '#000', color: i === step ? '#000' : '#9ca3af', fontSize: 12, fontWeight: 700 }}>{i + 1}. {s}</span>
        ))}
      </div>

      {step === 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Crew Name</label>
            <input value={payload.crew_name || ''} onChange={e => setField('crew_name', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>ID will be auto-generated (e.g., CRW-001) after Create.</div>
        </>
      )}

      {step === 1 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Email</label>
            <input value={payload.email || ''} onChange={e => setField('email', e.target.value)} type="email" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Phone</label>
            <input value={payload.phone || ''} onChange={e => setField('phone', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Languages</label>
            <input value={payload.languages || ''} onChange={e => setField('languages', e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Role/Position</label>
            <input value={payload.role || ''} onChange={e => setField('role', e.target.value)} placeholder="Cleaner / Technician / Supervisor" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Employment Type</label>
            <input value={payload.employment_type || ''} onChange={e => setField('employment_type', e.target.value)} placeholder="Full-time / Part-time / Contractor" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Start Date</label>
            <input value={payload.start_date || ''} onChange={e => setField('start_date', e.target.value)} placeholder="YYYY-MM-DD" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Availability</label>
            <input value={payload.availability || ''} onChange={e => setField('availability', e.target.value)} placeholder="Full-time / Weekends / Nights" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Skills</label>
            <input value={payload.skills || ''} onChange={e => setField('skills', e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Certification Level</label>
            <input value={payload.certification_level || ''} onChange={e => setField('certification_level', e.target.value)} placeholder="None / Level 1 / Level 2" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Contact Name</label>
            <input value={payload.emergency_contact_name || ''} onChange={e => setField('emergency_contact_name', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Relationship</label>
            <input value={payload.emergency_contact_relationship || ''} onChange={e => setField('emergency_contact_relationship', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Phone</label>
            <input value={payload.emergency_contact_phone || ''} onChange={e => setField('emergency_contact_phone', e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            <label style={{ color: '#aaa', fontSize: 13, width: 160 }}>Emergency Email</label>
            <input value={payload.emergency_contact_email || ''} onChange={e => setField('emergency_contact_email', e.target.value)} type="email" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <button onClick={back} disabled={step === 0} style={{ padding: '8px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 6, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>Back</button>
        {step < steps.length - 1 ? (
          <button onClick={next} disabled={!canNext()} style={{ padding: '8px 12px', background: canNext() ? '#22c55e' : '#1f2937', border: 'none', color: '#000', borderRadius: 6, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed' }}>Next</button>
        ) : (
          <button onClick={onCreate} disabled={creating || !canNext()} style={{ padding: '8px 12px', background: '#22c55e', border: 'none', color: '#000', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>{creating ? 'Creating…' : 'Create Crew'}</button>
        )}
        {message && <div style={{ color: '#9ca3af', fontSize: 13 }}>{message}</div>}
      </div>
    </div>
  );
}
function CreateProcedureCard() {
  const [name, setName] = useState('');
  const [centerId, setCenterId] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/procedures');
      const body = {
        procedure_name: name,
        center_id: centerId,
        description,
        steps,
        required_skills: requiredSkills,
        status
      };
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Procedure created');
      setName(''); setCenterId(''); setDescription(''); setSteps(''); setRequiredSkills(''); setStatus('active');
    } catch { setMsg('Create failed'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>📋 Create Procedure</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a new procedure (center-specific)</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Center ID</label>
        <input value={centerId} onChange={e => setCenterId(e.target.value)} placeholder="CEN-XXX" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Steps</label>
        <input value={steps} onChange={e => setSteps(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Req. Skills</label>
        <input value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 110 }}>Status</label>
        <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }}>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="pending">pending</option>
        </select>
      </div>
      <button onClick={onSave} disabled={saving || !name || !centerId} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE PROCEDURE'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}

function CreateTrainingCard() {
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [certLevel, setCertLevel] = useState('');
  const [requirements, setRequirements] = useState('');
  const [status, setStatus] = useState<'active'|'inactive'|'pending'>('active');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSave() {
    try {
      setSaving(true); setMsg(null);
      const url = buildAdminApiUrl('/training');
      const body = {
        training_name: name,
        service_id: serviceId,
        description,
        duration_hours: duration ? Number(duration) : undefined,
        certification_level: certLevel,
        requirements,
        status
      };
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { setMsg(js?.error || 'Create failed'); return; }
      setMsg('Training created');
      setName(''); setServiceId(''); setDescription(''); setDuration(''); setCertLevel(''); setRequirements(''); setStatus('active');
    } catch { setMsg('Create failed'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: 20, color: '#fff' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🎓 Create Training</div>
      <div style={{ marginBottom: 12, fontSize: 14, opacity: 0.8 }}>Add a training module linked to a service</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Service ID</label>
        <input value={serviceId} onChange={e => setServiceId(e.target.value)} placeholder="SRV-XXX" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Description</label>
        <input value={description} onChange={e => setDescription(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Duration (hrs)</label>
        <input value={duration} onChange={e => setDuration(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Cert Level</label>
        <input value={certLevel} onChange={e => setCertLevel(e.target.value)} style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ color: '#aaa', fontSize: 13, width: 120 }}>Requirements</label>
        <input value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="comma separated" style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #333', padding: '8px 10px', borderRadius: 6 }} />
      </div>
      <button onClick={onSave} disabled={saving || !name || !serviceId} style={{ width: '100%', padding: '12px 16px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        {saving ? 'Creating…' : 'CREATE TRAINING'}
      </button>
      {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#9ca3af' }}>{msg}</div>}
    </div>
  );
}
import LogoutButton from './components/LogoutButton';

type AdminSection = 'dashboard' | 'directory' | 'create' | 'assign' | 'support' | 'profile';
type DirectoryTab = 'management' | 'contractors' | 'customers' | 'centers' | 'crew' | 'services' | 'products_supplies' | 'training_procedures' | 'warehouses' | 'orders' | 'reports_feedback';

export default function AdminHome() {
  const { user } = useUser();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<DirectoryTab>('contractors');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Split view state for combined tabs
  const [activeSubType, setActiveSubType] = useState<{[key: string]: string}>({
    'products_supplies': 'products',
    'training_procedures': 'training',
    'reports_feedback': 'reports'
  });
  const [directoryData, setDirectoryData] = useState<any[]>([]);
  // Directory is read-only for MVP; creation happens in the Create tab
  const [createRole, setCreateRole] = useState<'manager'|'contractor'|'customer'|'center'|'crew'|'warehouse'>('contractor');
  const [createPayload, setCreatePayload] = useState<Record<string, any>>({});
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{ role: string; id: string; email?: string } | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [metrics, setMetrics] = useState<any>({
    users: { total: 0, created_today: 0 },
    support_tickets: { total: 0, open: 0, investigating: 0, high_priority: 0, today: 0, unread: 0 },
    system: { days_online: 0, activities_today: 0 }
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Set section based on URL path
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && ['dashboard', 'directory', 'create', 'activity', 'profile'].includes(path)) {
      setActiveSection(path as AdminSection);
    }
  }, [location.pathname]);

  // Load recent activities and metrics when dashboard is shown
  useEffect(() => {
    if (activeSection === 'dashboard') {
      loadRecentActivities();
      loadMetrics();
    }
  }, [activeSection]);

  async function loadRecentActivities() {
    try {
      setLoadingActivity(true);
      const response = await adminApiFetch('/api/activity?limit=10');
      if (response.ok) {
        const data = await response.json();
        setRecentActivities(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load recent activities:', error);
      setRecentActivities([]);
    } finally {
      setLoadingActivity(false);
    }
  }

  async function loadMetrics() {
    try {
      setLoadingMetrics(true);
      const response = await adminApiFetch('/api/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data || {
          users: { total: 0, created_today: 0 },
          support_tickets: { total: 0, open: 0, investigating: 0, high_priority: 0, today: 0, unread: 0 },
          system: { days_online: 0, activities_today: 0 }
        });
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  }

  // Validate admin access
  if (!user || !validateAdminRole(user)) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#000000',
        color: '#ffffff' 
      }}>
        <div style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Admin privileges required</div>
        </div>
      </div>
    );
  }

  // Get admin info
  const adminInfo = getAdminOperationalInfo(user);
  const adminSession = getAdminSession();
  const adminCode = adminSession.code || adminInfo.adminId || 'admin-000';
  const adminName = adminInfo.adminName || user.fullName || 'System Administrator';

  // Set admin session
  useEffect(() => {
    if (adminCode && adminName && adminInfo.adminId) {
      setAdminSession(adminCode, adminName, adminInfo.adminId);
    }
  }, [adminCode, adminName, adminInfo.adminId]);

  // Navigation sections
  const sections = [
    { id: 'dashboard', label: '🏠 Dashboard', description: 'System overview and metrics' },
    { id: 'directory', label: '📋 Directory', description: 'Search, filter, and review' },
    { id: 'create', label: '➕ Create', description: 'Create users and services' },
    { id: 'assign', label: '🔗 Assign', description: 'Link users and warehouses' },
    { 
      id: 'support', 
      label: '🎧 Support', 
      description: 'Technical support tickets from all hubs',
      badge: metrics.support_tickets.unread > 0 ? metrics.support_tickets.unread : null
    },
    { id: 'profile', label: '👤 Profile', description: 'Admin profile settings' },
  ];

  // Sample user data for directory
  const sampleUsers = [
    { id: 'mgr-001', name: 'John Smith', email: 'john.smith@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'con-045', name: 'Sarah Johnson', email: 'sarah@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Active', lastLogin: '1 day ago' },
    { id: 'cus-123', name: 'Mike Davis', email: 'mike@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '3 hours ago' },
    { id: 'ctr-089', name: 'Lisa Wilson', email: 'lisa@center.com', role: 'Center', hub: 'Center', status: 'Active', lastLogin: '1 hour ago' },
    { id: 'crw-234', name: 'Tom Brown', email: 'tom@crew.com', role: 'Crew', hub: 'Crew', status: 'Active', lastLogin: '30 min ago' },
    { id: 'mgr-002', name: 'Jennifer Lee', email: 'jennifer@cks.com', role: 'Manager', hub: 'Manager', status: 'Active', lastLogin: '4 hours ago' },
    { id: 'con-046', name: 'Robert Chen', email: 'robert@contractor.com', role: 'Contractor', hub: 'Contractor', status: 'Inactive', lastLogin: '2 weeks ago' },
    { id: 'cus-124', name: 'Amy Taylor', email: 'amy@customer.com', role: 'Customer', hub: 'Customer', status: 'Active', lastLogin: '1 day ago' },
  ];

  // Filter users based on search term
  const filteredUsers = sampleUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Directory tab configurations - ORDERED BY CHAIN OF COMMAND
  const directoryTabs = [
    { key: 'contractors' as DirectoryTab, label: 'Contractors', color: '#10b981', icon: '🏢' },
    { key: 'management' as DirectoryTab, label: 'Managers', color: '#3b82f6', icon: '👨‍💼' },
    { key: 'customers' as DirectoryTab, label: 'Customers', color: '#eab308', icon: '🎯' },
    { key: 'centers' as DirectoryTab, label: 'Centers', color: '#f97316', icon: '🏬' },
    { key: 'crew' as DirectoryTab, label: 'Crew', color: '#ef4444', icon: '👷' },
    { key: 'warehouses' as DirectoryTab, label: 'Warehouses', color: '#6366f1', icon: '🏭' },
    { key: 'services' as DirectoryTab, label: 'Services', color: '#8b5cf6', icon: '🔧' },
    { key: 'orders' as DirectoryTab, label: 'Orders', color: '#14b8a6', icon: '📊' },
    { key: 'products_supplies' as DirectoryTab, label: 'Products & Supplies', color: '#ec4899', icon: '📦' },
    { key: 'training_procedures' as DirectoryTab, label: 'Training & Procedures', color: '#f59e0b', icon: '🎓' },
    { key: 'reports_feedback' as DirectoryTab, label: 'Reports & Feedback', color: '#059669', icon: '📈' }
  ];


  // Action: create user
  async function handleCreateUser() {
    try {
      setCreating(true); setCreateMsg(null);
      
      let url, body;
      
      // Handle warehouse creation differently
      if (createRole === 'warehouse') {
        url = buildAdminApiUrl('/warehouses');
        body = { ...createPayload } as any;
      } else {
        url = buildAdminApiUrl('/users');
        // Ensure type role is not overridden by a form field named 'role'
        body = { ...createPayload, role: createRole } as any;
      }
      
      const r = await adminApiFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const js = await r.json();
      if (!r.ok) { 
        const detail = js?.details || js?.error || 'Create failed';
        setCreateMsg(`Create failed: ${detail}`);
        console.warn('[Admin Create] error', js);
        return; 
      }
      
      // Log system activity
      try {
        const activityType = createRole === 'warehouse' ? 'warehouse_created' : 'user_created';
        const targetType = createRole === 'warehouse' ? 'warehouse' : 'user';
        const targetName = createRole === 'warehouse' 
          ? createPayload.warehouse_name 
          : (createPayload.name || createPayload.manager_name || createPayload.company_name || createPayload.center_name || createPayload.crew_name || createPayload.email);
          
        await adminApiFetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_type: activityType,
            actor_id: user?.id || 'admin',
            actor_role: 'admin',
            target_id: js?.data?.id || targetName,
            target_type: targetType,
            description: `New ${createRole} ${createRole === 'warehouse' ? 'created' : 'user created'}: ${targetName || 'unknown'}`,
            metadata: { role: createRole, ...createPayload }
          })
        });
        // Refresh activities and metrics to show the new data
        loadRecentActivities();
        loadMetrics();
      } catch (activityError) {
        console.error('Failed to log creation activity:', activityError);
      }
      
      setCreateMsg('Created successfully');
      // Switch to relevant directory tab
      const map: Record<string, DirectoryTab> = { 
        manager: 'management', 
        contractor: 'contractors', 
        customer: 'customers', 
        center: 'centers', 
        crew: 'crew',
        warehouse: 'warehouses'
      };
      setActiveDirectoryTab(map[createRole]);
      // Reset form
      setCreatePayload({});
    } catch (e) {
      setCreateMsg('Create failed');
    } finally {
      setCreating(false);
    }
  }

  // Get directory schema/structure - AT-A-GLANCE ESSENTIAL FIELDS ONLY
  const getDirectorySchema = () => {
    switch (activeDirectoryTab) {
      case 'contractors':
        return { 
          contractor_id: 'CONTRACTOR ID', 
          cks_manager: 'CKS MANAGER',
          company_name: 'COMPANY NAME', 
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'management':
        return { 
          manager_id: 'MANAGER ID', 
          manager_name: 'MANAGER NAME',
          assigned_center: 'ASSIGNED CENTER',
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'customers':
        return { 
          customer_id: 'CUSTOMER ID', 
          cks_manager: 'CKS MANAGER',
          company_name: 'COMPANY NAME', 
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'centers':
        return { 
          center_id: 'CENTER ID', 
          manager_id: 'CKS MANAGER',
          name: 'CENTER NAME',
          customer_id: 'CUSTOMER ID',
          contractor_id: 'CONTRACTOR ID',
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'crew':
        return { 
          crew_id: 'CREW ID', 
          manager_id: 'CKS MANAGER',
          center_id: 'ASSIGNED CENTER',
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'services':
        return { id: 'SERVICE ID', name: 'SERVICE NAME', category: 'CATEGORY', status: 'STATUS', actions: 'ACTIONS' };
      case 'products_supplies':
        const productsSuppliesSubType = getCurrentSubType(activeDirectoryTab);
        if (productsSuppliesSubType === 'products') {
          return { id: 'PRODUCT ID', name: 'PRODUCT NAME', category: 'CATEGORY', unit: 'UNIT', status: 'STATUS' };
        } else if (productsSuppliesSubType === 'supplies') {
          return { id: 'SUPPLY ID', name: 'SUPPLY NAME', category: 'CATEGORY', status: 'STATUS' };
        }
        return { id: 'ID', name: 'NAME', category: 'CATEGORY', type: 'TYPE', status: 'STATUS' };
      case 'training_procedures':
        const trainingProceduresSubType = getCurrentSubType(activeDirectoryTab);
        if (trainingProceduresSubType === 'training') {
          return { id: 'TRAINING ID', service_id: 'SERVICE ID', name: 'TRAINING NAME', status: 'STATUS' };
        } else if (trainingProceduresSubType === 'procedures') {
          return { id: 'PROCEDURE ID', name: 'PROCEDURE NAME', center_id: 'CENTER ID', status: 'STATUS' };
        }
        return { id: 'ID', name: 'NAME', type: 'TYPE', status: 'STATUS' };
      case 'warehouses':
        return { 
          id: 'WAREHOUSE ID', 
          name: 'WAREHOUSE NAME',
          manager_id: 'MANAGER',
          status: 'STATUS',
          actions: 'ACTIONS'
        };
      case 'orders':
        return { 
          id: 'ORDER ID', 
          type: 'ORDER TYPE', 
          requester: 'REQUESTER', 
          status: 'STATUS', 
          date: 'DATE'
        };
      case 'reports_feedback':
        const reportsFeedbackSubType = getCurrentSubType(activeDirectoryTab);
        if (reportsFeedbackSubType === 'reports') {
          return {
            id: 'REPORT ID',
            subtype: 'REPORT TYPE',
            reporter: 'REPORTER',
            status: 'STATUS',
            date: 'DATE'
          };
        } else if (reportsFeedbackSubType === 'feedback') {
          return {
            id: 'FEEDBACK ID',
            subtype: 'FEEDBACK KIND',
            title: 'TITLE',
            created_by: 'CREATED BY',
            date: 'DATE'
          };
        }
        return {
          id: 'ID',
          type: 'TYPE',
          subtype: 'SUBTYPE', 
          title: 'TITLE',
          status: 'STATUS', 
          date: 'DATE'
        };
      default:
        return {};
    }
  };

  // Helper functions for split view functionality
  const getCombinedTabs = () => ['products_supplies', 'training_procedures', 'reports_feedback'];
  
  const isCombinedTab = (tab: DirectoryTab) => getCombinedTabs().includes(tab);
  
  const getSubTypes = (tab: DirectoryTab) => {
    switch (tab) {
      case 'products_supplies':
        return { 
          products: { label: 'Products', color: '#10b981', icon: '📦' },
          supplies: { label: 'Supplies', color: '#3b82f6', icon: '🧰' }
        };
      case 'training_procedures':
        return { 
          training: { label: 'Training', color: '#f59e0b', icon: '🎓' },
          procedures: { label: 'Procedures', color: '#8b5cf6', icon: '📋' }
        };
      case 'reports_feedback':
        return { 
          reports: { label: 'Reports', color: '#ef4444', icon: '📊' },
          feedback: { label: 'Feedback', color: '#14b8a6', icon: '💬' }
        };
      default:
        return {};
    }
  };
  
  const getCurrentSubType = (tab: DirectoryTab) => {
    return isCombinedTab(tab) ? activeSubType[tab] || Object.keys(getSubTypes(tab))[0] : null;
  };
  
  const setSubType = (tab: DirectoryTab, subType: string) => {
    if (isCombinedTab(tab)) {
      setActiveSubType(prev => ({ ...prev, [tab]: subType }));
    }
  };

  // Legacy assign state (minimal - kept for compatibility)
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  // Create tab state
  type CreateTab = 'users' | 'services' | 'products_supplies' | 'training_procedures';
  const [activeCreateTab, setActiveCreateTab] = useState<CreateTab>('users');

  // Legacy assign options loader removed - now handled by BucketAssignmentSystem

  // Use fetched directory data
  const getCurrentDirectoryData = () => directoryData;

  // Delete from directory row (uses activeDirectoryTab)
  const handleDirectoryDelete = async (item: any) => {
    try {
      let endpoint = '';
      let id = '';
      switch (activeDirectoryTab) {
        case 'contractors':
          id = item.contractor_id; endpoint = `/contractors/${id}`; break;
        case 'management':
          id = item.manager_id; endpoint = `/managers/${id}`; break;
        case 'customers':
          id = item.customer_id; endpoint = `/customers/${id}`; break;
        case 'centers':
          id = item.id || item.center_id; endpoint = `/centers/${id}`; break;
        case 'crew':
          id = item.crew_id; endpoint = `/crew/${id}`; break;
        case 'warehouses':
          id = item.id; endpoint = `/warehouses/${id}`; break;
        case 'services':
          id = item.id; endpoint = `/catalog/items/${id}`; break;
        default:
          return;
      }
      if (!id) return;
      const ok = confirm(`Delete ${id}? This cannot be undone.`);
      if (!ok) return;
      const r = await adminApiFetch(buildAdminApiUrl(endpoint), { method: 'DELETE' });
      if (!r.ok) {
        const j = await r.json().catch(()=>({}));
        alert(`Delete failed: ${j?.error || r.status}`);
        return;
      }
      setDirectoryData(prev => prev.filter((row:any) => {
        const rowId = row.contractor_id || row.customer_id || row.center_id || row.crew_id || row.id || row.manager_id;
        return rowId !== id;
      }));
    } catch (e:any) {
      alert(`Delete error: ${e?.message || e}`);
    }
  };

  const handleDirectoryInvite = async (item: any) => {
    try {
      let role = '';
      let code = '';
      let email = '';
      switch (activeDirectoryTab) {
        case 'management':
          role = 'manager'; code = item.manager_id; email = item.email || item.manager_email || '';
          break;
        case 'contractors':
          role = 'contractor'; code = item.contractor_id; email = item.email || '';
          break;
        case 'customers':
          role = 'customer'; code = item.customer_id; email = item.email || '';
          break;
        case 'centers':
          role = 'center'; code = item.center_id || item.id; email = item.email || '';
          break;
        case 'crew':
          role = 'crew'; code = item.crew_id; email = item.email || '';
          break;
        case 'warehouses':
          role = 'warehouse'; code = item.id; email = item.email || '';
          break;
        default:
          alert('Invite not supported for this tab');
          return;
      }
      if (!email) { alert('No email on file for this user.'); return; }
      
      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('dev');
      
      if (isDevelopment) {
        alert(`🚧 Development Mode Notice\n\nEmail invitations are disabled in development mode.\n\n✅ Invitations work normally in production mode.`);
        return;
      }
      
      const ok = confirm(`Send Clerk invite to ${email} for ${code}?`);
      if (!ok) return;
      const r = await adminApiFetch(buildAdminApiUrl('/auth/invite'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, code, email })
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 501 || j?.error === 'clerk_not_configured') {
          throw new Error('Clerk is not configured on the server. Add CLERK_SECRET_KEY and install @clerk/clerk-sdk-node.');
        }
        throw new Error(j?.error || 'Invite failed');
      }
      alert('Invitation sent');
    } catch (e:any) {
      alert(`Invite failed: ${e?.message || e}`);
    }
  };

  // Fetch directory data by tab
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true); setError(null);
      try {
        let urls: string[] = [];
        let items: any[] = [];
        
        // Handle single tab requests
        if (activeDirectoryTab === 'management') urls = [buildAdminApiUrl('/managers', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'contractors') urls = [buildAdminApiUrl('/contractors', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'customers') urls = [buildAdminApiUrl('/customers', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'centers') urls = [buildAdminApiUrl('/centers', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'crew') urls = [buildAdminApiUrl('/crew', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'services') urls = [buildAdminApiUrl('/catalog/items', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'warehouses') urls = [buildAdminApiUrl('/warehouses', { q: searchTerm, limit: 25, offset: 0 })];
        if (activeDirectoryTab === 'orders') urls = [buildAdminApiUrl('/orders', { q: searchTerm, limit: 25, offset: 0 })];
        
        // Handle combined tabs based on selected sub-type
        if (isCombinedTab(activeDirectoryTab)) {
          const currentSubType = getCurrentSubType(activeDirectoryTab);
          if (activeDirectoryTab === 'products_supplies') {
            if (currentSubType === 'products') {
              urls = [buildAdminApiUrl('/products', { q: searchTerm, limit: 25, offset: 0 })];
            } else if (currentSubType === 'supplies') {
              urls = [buildAdminApiUrl('/supplies', { q: searchTerm, limit: 25, offset: 0 })];
            }
          }
          if (activeDirectoryTab === 'training_procedures') {
            if (currentSubType === 'training') {
              urls = [buildAdminApiUrl('/training', { q: searchTerm, limit: 25, offset: 0 })];
            } else if (currentSubType === 'procedures') {
              urls = [buildAdminApiUrl('/procedures', { q: searchTerm, limit: 25, offset: 0 })];
            }
          }
          if (activeDirectoryTab === 'reports_feedback') {
            if (currentSubType === 'reports') {
              urls = [`/api/reports`];
            } else if (currentSubType === 'feedback') {
              urls = [`/api/feedback`];
            }
          }
        }
        
        if (!urls.length) { setDirectoryData([]); return; }
        
        // Fetch data from all URLs
        const responses = await Promise.all(urls.map(url => adminApiFetch(url)));
        const jsonResults = await Promise.all(responses.map(r => r.json()));
        
        if (cancelled) return;
        
        // Combine all items from multiple sources
        items = jsonResults.flatMap(js => js.items || js.data || []);
        const rows = items.map((it: any) => {
          switch (activeDirectoryTab) {
            case 'management':
              return { manager_id: it.manager_id, manager_name: it.manager_name, assigned_center: it.assigned_center, status: it.status, email: it.email };
            case 'contractors':
              return { contractor_id: it.contractor_id, cks_manager: it.cks_manager, company_name: it.company_name, status: it.status, email: it.email };
            case 'customers':
              return { customer_id: it.customer_id, cks_manager: it.cks_manager, company_name: it.company_name, status: it.status, email: it.email };
            case 'centers':
              return { center_id: it.center_id, manager_id: it.cks_manager, name: it.name || it.center_name, customer_id: it.customer_id, contractor_id: it.contractor_id, status: it.status, email: it.email };
            case 'crew':
              return { crew_id: it.crew_id, manager_id: it.cks_manager, center_id: it.assigned_center, status: it.status, email: it.email };
            case 'services':
              return { id: it.id, name: it.name, category: it.category, status: it.status || (it.active ? 'active' : 'inactive') };
            case 'warehouses':
              return { id: it.warehouse_id, name: it.warehouse_name, manager_id: it.manager_id, status: it.status, email: it.email };
            case 'orders':
              return { id: it.order_id, name: it.order_name || it.description, customer_id: it.customer_id, status: it.status };
            case 'products_supplies':
              const currentProductsSuppliesSubType = getCurrentSubType(activeDirectoryTab);
              if (currentProductsSuppliesSubType === 'products') {
                return { id: it.product_id || it.id, name: it.product_name || it.name, category: it.category, unit: it.unit, status: it.status };
              } else if (currentProductsSuppliesSubType === 'supplies') {
                return { id: it.supply_id || it.id, name: it.supply_name || it.name, category: it.category, status: it.status };
              }
              // Fallback for mixed data
              if (it.product_id) {
                return { id: it.product_id, name: it.product_name, category: it.category, unit: it.unit, status: it.status };
              } else if (it.supply_id) {
                return { id: it.supply_id, name: it.supply_name, category: it.category, status: it.status };
              } else {
                return { id: it.id, name: it.name, category: it.category, status: it.status };
              }
            case 'training_procedures':
              const currentTrainingProceduresSubType = getCurrentSubType(activeDirectoryTab);
              if (currentTrainingProceduresSubType === 'training') {
                return { id: it.training_id || it.id, service_id: it.service_id, name: it.training_name || it.name, status: it.status };
              } else if (currentTrainingProceduresSubType === 'procedures') {
                return { id: it.procedure_id || it.id, name: it.procedure_name || it.name, center_id: it.center_id, status: it.status };
              }
              // Fallback for mixed data
              if (it.training_id) {
                return { id: it.training_id, service_id: it.service_id, name: it.training_name, status: it.status };
              } else if (it.procedure_id) {
                return { id: it.procedure_id, name: it.procedure_name, center_id: it.center_id, status: it.status };
              } else {
                return { id: it.id, name: it.name, status: it.status };
              }
            case 'reports_feedback':
              const currentReportsFeedbackSubType = getCurrentSubType(activeDirectoryTab);
              if (currentReportsFeedbackSubType === 'reports') {
                return { id: it.report_id || it.id, subtype: it.type, reporter: `${it.created_by_role}:${it.created_by_id}`, status: it.status, date: it.created_at };
              } else if (currentReportsFeedbackSubType === 'feedback') {
                return { id: it.feedback_id || it.id, subtype: it.kind, title: it.title, created_by: `${it.created_by_role}:${it.created_by_id}`, date: it.created_at };
              }
              // Fallback for mixed data
              if (it.report_id) {
                return { id: it.report_id, subtype: it.type, reporter: `${it.created_by_role}:${it.created_by_id}`, status: it.status, date: it.created_at };
              } else if (it.feedback_id) {
                return { id: it.feedback_id, subtype: it.kind, title: it.title, created_by: `${it.created_by_role}:${it.created_by_id}`, date: it.created_at };
              } else {
                return { id: it.id, title: it.title || it.type, date: it.created_at, status: it.status };
              }
            default:
              return it;
          }
        });
        // Filter out template/mock rows for specific tabs (read-only Directory)
        const filtered = rows.filter((row: any) => {
          if (activeDirectoryTab === 'warehouses') {
            const id = String(row.id || '').toUpperCase();
            const name = String(row.name || '');
            // Hide template warehouse and any obvious template-named rows
            if (id === 'WH-000') return false;
            if (/template/i.test(name)) return false;
          }
          if (activeDirectoryTab === 'services') {
            const id = String(row.id || '');
            const name = String(row.name || '');
            // Exclude placeholder/template services
            if (/template/i.test(name)) return false;
            if (/(^|-)000$/i.test(id)) return false;
          }
          if (activeDirectoryTab === 'products_supplies' || activeDirectoryTab === 'training_procedures') {
            const name = String(row.name || '');
            // Exclude template/placeholder items from combined tabs
            if (/template/i.test(name)) return false;
            if (/(^|-)000$/i.test(String(row.id || ''))) return false;
          }
          return true;
        });

        // IMPORTANT: For a clean Admin Directory until real records are created,
        // force an empty result set for Services and Warehouses so the UI shows
        // the intended empty-state instead of seeded/demo/template items.
        const final = (activeDirectoryTab === 'services' || activeDirectoryTab === 'warehouses') ? [] : filtered;
        setDirectoryData(final);
      } catch (e) {
        if (!cancelled) setError('Failed to load directory');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [activeDirectoryTab, searchTerm, activeSubType]);

  // Smart field detection for user creation - COMPREHENSIVE FORMS
  const getRequiredFieldsForUserType = (userType: DirectoryTab) => {
    const fieldsMap = {
      contractors: ['company_name', 'address', 'contact_person', 'phone', 'email', 'website'],
      management: ['id', 'name', 'status', 'assigned_center', 'territory', 'phone', 'email', 'start_date'],
      customers: ['id', 'name', 'status', 'manager_id', 'contact_person', 'phone', 'email', 'address'],
      centers: ['id', 'name', 'status', 'manager_id', 'customer_id', 'contractor_id', 'address', 'phone', 'supervisor_notes'],
      crew: ['id', 'name', 'status', 'manager_id', 'center_id', 'role', 'phone', 'email', 'start_date', 'skills'],
      services: ['id', 'name', 'status', 'category', 'description', 'requirements'],
      warehouses: ['id', 'name', 'status', 'type', 'location', 'capacity', 'manager_contact'],
      orders: ['id', 'type', 'requester', 'status', 'date', 'description', 'priority'],
      products_supplies: ['id', 'name', 'type', 'status', 'category', 'description', 'warehouse_id'],
      training_procedures: ['id', 'name', 'type', 'status', 'center_id', 'description', 'requirements'],
      reports_feedback: ['id', 'type', 'subtype', 'status', 'date', 'summary', 'priority']
    };
    return fieldsMap[userType] || ['id', 'name', 'status'];
  };

  // Render section content based on activeSection
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'directory':
        return (
      <div style={{ padding: '24px 0' }}>
        {/* CKS Directory Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
            🧠 CKS Directory - Complete Business Intelligence
          </h2>
          <p style={{ color: '#888888', fontSize: 14 }}>
            At-a-glance directory showing essential fields. Click any ID to view detailed profile with complete information.
          </p>
        </div>

        {/* Directory Tabs */}
        <div style={{ 
          background: '#111111',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          border: '1px solid #333333'
        }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {directoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveDirectoryTab(tab.key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: `1px solid ${activeDirectoryTab === tab.key ? tab.color : '#444444'}`,
                  background: activeDirectoryTab === tab.key ? tab.color : '#222222',
                  color: activeDirectoryTab === tab.key ? '#000000' : tab.color,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Split View Sub-tabs for Combined Tabs */}
          {isCombinedTab(activeDirectoryTab) && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              background: '#0a0a0a',
              borderRadius: 6,
              border: '1px solid #333333'
            }}>
              <div style={{ fontSize: 12, color: '#888888', marginBottom: 8, fontWeight: 600 }}>
                View Type:
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(getSubTypes(activeDirectoryTab)).map(([key, config]: [string, any]) => (
                  <button
                    key={key}
                    onClick={() => setSubType(activeDirectoryTab, key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: `1px solid ${getCurrentSubType(activeDirectoryTab) === key ? config.color : '#444444'}`,
                      background: getCurrentSubType(activeDirectoryTab) === key ? config.color : '#1a1a1a',
                      color: getCurrentSubType(activeDirectoryTab) === key ? '#000000' : config.color,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>{config.icon}</span>
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar & Actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <input
              type="text"
              placeholder={`Search ${isCombinedTab(activeDirectoryTab) 
                ? getSubTypes(activeDirectoryTab)[getCurrentSubType(activeDirectoryTab) || '']?.label || activeDirectoryTab
                : activeDirectoryTab}... (first 25 rows shown)`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#000000',
                border: '1px solid #333333',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 14
              }}
            />
            {/* Create actions are removed from Directory; use the Create tab */}
          </div>

          {/* Data Table */}
          <div style={{ 
            background: '#000000',
            border: '1px solid #333333',
            borderRadius: 6,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '12px 16px', background: '#1a1a1a', borderBottom: '1px solid #333333' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                {isCombinedTab(activeDirectoryTab) 
                  ? `${getSubTypes(activeDirectoryTab)[getCurrentSubType(activeDirectoryTab) || '']?.label || activeDirectoryTab} Directory`
                  : `${activeDirectoryTab.charAt(0).toUpperCase() + activeDirectoryTab.slice(1)} Directory`
                } ({getCurrentDirectoryData().length} entries)
              </div>
              <div style={{ fontSize: 11, color: '#666666', marginTop: 2 }}>
                Field Structure: {Object.values(getDirectorySchema()).join(' • ')}
              </div>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0a0a0a' }}>
                    {Object.values(getDirectorySchema()).map((fieldName, index) => (
                      <th key={index} style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: '#888888',
                        borderBottom: '1px solid #333333'
                      }}>
                        {fieldName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={Object.keys(getDirectorySchema()).length} style={{ padding: 24, color: '#888' }}>Loading…</td></tr>
                  ) : getCurrentDirectoryData().length > 0 ? (
                    getCurrentDirectoryData()
                      .filter(item => 
                        !searchTerm || 
                        Object.values(item).some(val => 
                          String(val).toLowerCase().includes(searchTerm.toLowerCase())
                        )
                      )
                      .slice(0, 25)
                      .map((item, index) => (
                        <tr key={index} style={{ 
                          borderBottom: '1px solid #222222'
                        }}>
                          {Object.keys(getDirectorySchema()).map((key, i) => (
                            <td key={i} style={{ 
                              padding: '12px 16px', 
                              fontSize: 14, 
                              color: '#ffffff',
                              borderBottom: '1px solid #222222'
                            }}>
                              {key !== 'actions' ? (
                                (() => {
                                  const v = (item as any)[key];
                                  const needsAssign = ['cks_manager','manager_id','customer_id','contractor_id','center_id'];
                                  if (needsAssign.includes(key) && (v === null || v === undefined || v === '')) {
                                    return 'Unassigned';
                                  }
                                  return String(v ?? '');
                                })()
                              ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    onClick={() => handleDirectoryInvite(item)}
                                    style={{
                                      background: '#111827',
                                      border: '1px solid #374151',
                                      borderRadius: 6,
                                      color: 'white',
                                      padding: '6px 8px',
                                      fontSize: 12,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Invite
                                  </button>
                                  <button
                                    onClick={() => handleDirectoryDelete(item)}
                                    style={{
                                      background: '#dc2626',
                                      border: 'none',
                                      borderRadius: 6,
                                      color: 'white',
                                      padding: '6px 8px',
                                      fontSize: 12,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                  ) : (
                    <tr style={{ borderBottom: '1px solid #222222' }}>
                      <td 
                        colSpan={Object.keys(getDirectorySchema()).length} 
                        style={{ 
                          padding: '40px', 
                          textAlign: 'center', 
                          color: '#666666',
                          fontSize: 14,
                          fontStyle: 'italic'
                        }}
                      >
                        No {isCombinedTab(activeDirectoryTab) 
                          ? getSubTypes(activeDirectoryTab)[getCurrentSubType(activeDirectoryTab) || '']?.label?.toLowerCase() || activeDirectoryTab
                          : activeDirectoryTab} entries yet. Go to the Create tab to add the first {isCombinedTab(activeDirectoryTab) 
                          ? getSubTypes(activeDirectoryTab)[getCurrentSubType(activeDirectoryTab) || '']?.label?.toLowerCase()?.slice(0, -1) || activeDirectoryTab.slice(0, -1)
                          : activeDirectoryTab.slice(0, -1)} entry.
                        <br/><span style={{ fontSize: 12, color: '#444444' }}>
                          Fields will populate: {Object.values(getDirectorySchema()).join(' • ')}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create UI is not shown in Directory. Use the Create tab. */}
      </div>
        );

      case 'dashboard':
        return (
          <div style={{ padding: '20px 0' }}>
            {/* Welcome Header */}
            <div style={{
              background: 'linear-gradient(135deg, #000000 0%, #1f1f1f 100%)',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                Welcome, {adminName}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>
                System Administrator ({adminCode})
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {/* Total Users */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>
                  {loadingMetrics ? '...' : metrics.users.total.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Total Users</div>
              </div>
              
              {/* Open Support Tickets */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>
                  {loadingMetrics ? '...' : metrics.support_tickets.open}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Open Support Tickets</div>
              </div>
              
              {/* High Priority Tickets */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#eab308' }}>
                  {loadingMetrics ? '...' : metrics.support_tickets.high_priority}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>High Priority</div>
              </div>
              
              {/* Days Online */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 8,
                padding: 16,
                color: '#ffffff',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f97316' }}>
                  {loadingMetrics ? '...' : metrics.system.days_online}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>Days Online</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: 12,
              padding: 20,
              color: '#ffffff'
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Recent System Activity</div>
              {loadingActivity ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Loading activities...</div>
              ) : recentActivities.length === 0 ? (
                <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>No recent activities</div>
              ) : (
                <div style={{ space: 12 }}>
                  {recentActivities.slice(0, 5).map((activity: any) => (
                    <div key={activity.activity_id} style={{ padding: '8px 0', borderBottom: recentActivities.indexOf(activity) < 4 ? '1px solid #333333' : 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{activity.description}</div>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>
                        {activity.actor_role && `${activity.actor_role} • `}
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'create':
        return (
          <div style={{ padding: '20px 0' }}>
            {/* Clean header */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>Create</div>
            </div>

            {/* Create tabs */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #333333' }}>
                {[
                  { key: 'users', label: 'Users', icon: '👤' },
                  { key: 'services', label: 'Services', icon: '🛠️' },
                  { key: 'products_supplies', label: 'Products & Supplies', icon: '📦' },
                  { key: 'training_procedures', label: 'Training & Procedures', icon: '🎓' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveCreateTab(tab.key as CreateTab)}
                    style={{
                      padding: '12px 20px',
                      background: activeCreateTab === tab.key ? '#111111' : 'transparent',
                      border: activeCreateTab === tab.key ? '1px solid #333333' : '1px solid transparent',
                      borderBottom: activeCreateTab === tab.key ? '1px solid #111111' : '1px solid transparent',
                      borderRadius: '8px 8px 0 0',
                      color: activeCreateTab === tab.key ? '#ffffff' : '#888888',
                      fontSize: 14,
                      fontWeight: activeCreateTab === tab.key ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: -1
                    }}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div style={{
              background: '#111111',
              border: '1px solid #333333',
              borderRadius: '0 12px 12px 12px',
              padding: 24,
              minHeight: 400
            }}>
              {activeCreateTab === 'users' && (
                <>
                  <UnifiedUserCreateForm 
                    handleCreateUser={handleCreateUser}
                    creating={creating}
                    createMsg={createMsg}
                    setCreateMsg={setCreateMsg}
                    createPayload={createPayload}
                    setCreatePayload={setCreatePayload}
                    createRole={createRole}
                    setCreateRole={setCreateRole}
                  />
                  {lastCreated && lastCreated.email && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        onClick={async () => {
                          try {
                            const r = await adminApiFetch(buildAdminApiUrl('/auth/invite'), {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ role: lastCreated.role, code: lastCreated.id, email: lastCreated.email })
                            });
                            const j = await r.json();
                            if (!r.ok) throw new Error(j?.error || 'Invite failed');
                            alert('Invitation sent successfully');
                          } catch (e: any) {
                            alert(`Invite failed: ${e?.message || e}`);
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          background: '#111827',
                          border: '1px solid #374151',
                          color: '#fff',
                          borderRadius: 6,
                          fontSize: 12,
                          cursor: 'pointer'
                        }}
                      >
                        Send Clerk Invite
                      </button>
                    </div>
                  )}
                </>
              )}

              {activeCreateTab === 'services' && (
                <div>
                  <CreateServiceCard />
                </div>
              )}

              {activeCreateTab === 'training_procedures' && (
                <TrainingProceduresSection />
              )}

              {activeCreateTab === 'products_supplies' && (
                <ProductsSuppliesSection />
              )}
            </div>
          </div>
        );

      case 'manage':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Manage Resources</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage existing users, roles, and system resources</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Edit, deactivate, or manage existing user accounts
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>1,523 users</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE USERS
                </button>
              </div>

              {/* Role Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🎭 Role Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Modify permissions and manage existing roles
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>6 active roles</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE ROLES
                </button>
              </div>

              {/* Center Management */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏢 Center Management</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage customer centers and their assignments
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>342 active centers</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE CENTERS
                </button>
              </div>

              {/* System Resources */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔧 System Resources</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Manage system configurations and resources
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>System healthy</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  MANAGE SYSTEM
                </button>
              </div>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Smart Assignment System</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Select users from unassigned pools and assign them to appropriate roles</div>
              <div style={{ fontSize: 12, opacity: 0.6, color: '#ffffff', marginTop: 8 }}>
                Smart Rules: Contractor → Manager | Customer → Contractor | Center → Customer | Crew → Manager | Warehouse → Manager
              </div>
            </div>

            {/* Simplified Assignment System */}
            <SimplifiedAssignmentSystem />
          </div>
        );

      case 'directory':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>CKS Directory</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Searchable database of all users with IDs and basic information</div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Search users by name, ID, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 500,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid #333333',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Users Table */}
            <div style={{ 
              border: '1px solid #333333',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#111111'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#000000' }}>
                  <tr>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      User ID
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Name
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Email
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Role
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Hub
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Status
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Last Login
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#ffffff',
                      borderBottom: '1px solid #333333'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const hubColor = 
                      user.hub === 'Manager' ? '#3b82f6' :
                      user.hub === 'Contractor' ? '#10b981' :
                      user.hub === 'Customer' ? '#eab308' :
                      user.hub === 'Center' ? '#f97316' :
                      user.hub === 'Crew' ? '#ef4444' : '#666666';
                    
                    return (
                      <tr key={user.id} style={{ borderTop: index > 0 ? '1px solid #333333' : 'none' }}>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: 600
                        }}>
                          {user.id}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.name}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.email}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14
                        }}>
                          {user.role}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            background: hubColor,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600
                          }}>
                            {user.hub}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <span style={{
                            color: user.status === 'Active' ? '#10b981' : '#f87171',
                            fontWeight: 600
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          color: '#ffffff',
                          fontSize: 14,
                          opacity: 0.8
                        }}>
                          {user.lastLogin}
                        </td>
                        <td style={{ 
                          padding: '12px 16px', 
                          fontSize: 14
                        }}>
                          <button style={{
                            padding: '4px 8px',
                            background: '#333333',
                            border: '1px solid #555555',
                            borderRadius: 4,
                            color: '#ffffff',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}>
                            View Account
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: '#888888',
                fontSize: 14
              }}>
                No users found matching "{searchTerm}"
              </div>
            )}
          </div>
        );

      case 'reports':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>System Reports</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Analytics and reporting for all hub activities</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              {/* User Activity Report */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>👥 User Activity</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Login patterns, session duration, and user engagement across all hubs
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>247 active users today</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Hub Performance */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🏠 Hub Performance</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Usage statistics and performance metrics for each hub type
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>All hubs operational</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* Security Audit */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>🔒 Security Audit</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Security events, failed logins, and system vulnerabilities
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>Last scan: 2 hours ago</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>

              {/* System Health */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>💚 System Health</div>
                <div style={{ marginBottom: 16, fontSize: 14, opacity: 0.8 }}>
                  Server performance, uptime, and resource utilization
                </div>
                <div style={{ marginBottom: 16, fontSize: 12, opacity: 0.6 }}>98.5% uptime</div>
                <button style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                  border: '1px solid #555555',
                  borderRadius: 8,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: 14
                }}>
                  VIEW REPORT
                </button>
              </div>
            </div>
          </div>
        );

      case 'support':
        return <AdminSupportSection />;

      case 'profile':
        return (
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>Admin Profile</div>
              <div style={{ fontSize: 14, opacity: 0.8, color: '#ffffff' }}>Manage your administrator profile and preferences</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
              {/* Profile Info */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32
                  }}>
                    👤
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>{adminName}</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>{adminCode}</div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>System Administrator</div>
                </div>
                
                <div style={{ space: 12 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14 }}>{user.primaryEmailAddress?.emailAddress}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Department</div>
                    <div style={{ fontSize: 14 }}>{adminInfo.department}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Last Login</div>
                    <div style={{ fontSize: 14 }}>{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              {/* Profile Settings */}
              <div style={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 12,
                padding: 20,
                color: '#ffffff'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Profile Settings</div>
                
                <div style={{ space: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Admin Code
                    </label>
                    <input
                      type="text"
                      value={adminCode}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, display: 'block' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.primaryEmailAddress?.emailAddress || ''}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000000',
                        border: '1px solid #333333',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 14
                      }}
                      readOnly
                    />
                  </div>

                  <button style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
                    border: '1px solid #555555',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14,
                    marginRight: 12
                  }}>
                    UPDATE PROFILE
                  </button>

                  <button style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid #333333',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 14
                  }}>
                    CHANGE PASSWORD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={{ padding: '24px 0', textAlign: 'center', color: '#ffffff' }}>
            <h2>Section: {activeSection}</h2>
            <p>Content for {activeSection} section will be implemented here.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      color: '#ffffff' 
    }}>
      {/* Header */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>⚫ AdminHub</div>
            <div style={{ fontSize: 14, opacity: 0.8 }}>System Control Center</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{adminName}</div>
            <div style={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              background: '#10b981' 
            }}></div>
            <LogoutButton />
          </div>
        </div>
      </div>


      {/* Navigation */}
      <div style={{
        background: '#111111',
        borderBottom: '1px solid #333333',
        padding: '0 24px',
        overflowX: 'auto'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as AdminSection)}
                style={{
                  padding: '12px 16px',
                  background: activeSection === section.id ? '#ffffff' : 'transparent',
                  color: activeSection === section.id ? '#000000' : '#ffffff',
                  border: 'none',
                  borderBottom: activeSection === section.id ? '2px solid #ffffff' : '2px solid transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                {section.label}
                {section.badge && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 12,
                    minWidth: 18,
                    textAlign: 'center',
                    lineHeight: 1
                  }}>
                    {section.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {renderSectionContent()}
      </div>
    </div>
  );
}
