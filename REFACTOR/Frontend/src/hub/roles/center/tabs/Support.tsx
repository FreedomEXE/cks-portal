/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Support.tsx
 * 
 * Description: Center support and help system
 * Function: Access help resources, submit tickets, and contact support
 * Importance: Critical - Support and assistance for center operations
 * Connects to: Support API, ticketing system, knowledge base
 */

import React, { useState, useEffect } from 'react';

interface CenterSupportProps {
  userId: string;
  config: any;
  features: any;
  api: any;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'high' | 'medium' | 'low';
  date_created: string;
  category: 'technical' | 'billing' | 'general' | 'urgent';
}

export default function CenterSupport({ userId, config, features, api }: CenterSupportProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'tickets' | 'resources'>('contact');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Mock tickets data
      const mockTickets: SupportTicket[] = [
        {
          id: 'TKT-001',
          subject: 'System Access Issue',
          status: 'open',
          priority: 'high',
          date_created: '2025-09-10',
          category: 'technical'
        },
        {
          id: 'TKT-002',
          subject: 'Invoice Question',
          status: 'resolved',
          priority: 'low',
          date_created: '2025-09-08',
          category: 'billing'
        }
      ];
      setTickets(mockTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16 
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Support</h2>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['contact', 'tickets', 'resources'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab ? '#059669' : 'white',
              color: activeTab === tab ? 'white' : '#111827',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'tickets' ? `Tickets (${tickets.length})` : tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ui-card" style={{ padding: 24 }}>
        {activeTab === 'contact' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Contact Support
            </h3>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div style={{
                padding: 20,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📞</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Phone Support</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>1-800-CKS-HELP</div>
              </div>
              <div style={{
                padding: 20,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✉️</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Email Support</div>
                <div style={{ color: '#6b7280', fontSize: 14 }}>support@cks.com</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Support Tickets
            </h3>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div>Loading tickets...</div>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎫</div>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>
                  No support tickets
                </div>
                <div style={{ fontSize: 12 }}>
                  Your support tickets will appear here
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {tickets.map(ticket => (
                  <div key={ticket.id} style={{
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    background: '#f9fafb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#111827' }}>
                          {ticket.subject}
                        </h4>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {ticket.id} • {ticket.category} • {ticket.date_created}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background: getStatusColor(ticket.status),
                        color: 'white'
                      }}>
                        {ticket.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#111827' }}>
              Help Resources
            </h3>
            <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
              Help resources and documentation will be available here
            </div>
          </div>
        )}
      </div>
    </div>
  );
}