/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Support.tsx
 * 
 * Description: Customer support center with ticket submission and assistance
 * Function: Provide customer support ticketing and account manager contact
 * Importance: Critical - Customer service for client support
 * Connects to: Support API endpoints, account manager integration
 */

import React, { useState } from 'react';

interface SupportProps {
  userId: string;
  config: any;
  features: Record<string, any>;
  api: any;
}

interface SupportTicket {
  issue_type: string;
  priority: string;
  subject: string;
  description: string;
  center_id: string;
}

export default function Support({ userId, config, features, api }: SupportProps) {
  const [ticket, setTicket] = useState<SupportTicket>({
    issue_type: 'service_issue',
    priority: 'medium',
    subject: '',
    description: '',
    center_id: ''
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket.subject || !ticket.description) {
      alert('Please fill in subject and description');
      return;
    }

    try {
      // Mock ticket submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ticketId = `TKT-${Date.now()}`;
      alert(`Customer support ticket ${ticketId} submitted successfully!\n\nExpected Response Time: 4-8 hours\nYou will receive an email confirmation shortly.`);
      
      // Clear form
      setTicket({
        issue_type: 'service_issue',
        priority: 'medium',
        subject: '',
        description: '',
        center_id: ''
      });
      
    } catch (error) {
      console.error('Support ticket submission error:', error);
      alert('Failed to submit support ticket. Please try again or contact your account manager directly.');
    }
  };

  const clearForm = () => {
    setTicket({
      issue_type: 'service_issue',
      priority: 'medium',
      subject: '',
      description: '',
      center_id: ''
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Customer Support Center</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Support Ticket Form */}
        <div className="ui-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#eab308' }}>
            Submit Support Ticket
          </h3>
          
          <form onSubmit={handleSubmitTicket} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Issue Type
                </label>
                <select
                  value={ticket.issue_type}
                  onChange={(e) => setTicket({ ...ticket, issue_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  <option value="service_issue">Service Issue</option>
                  <option value="billing">Billing Question</option>
                  <option value="technical">Technical Support</option>
                  <option value="account_issue">Account Issue</option>
                  <option value="general">General Inquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Priority Level
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent - Service Impact</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Related Center (optional)
              </label>
              <select
                value={ticket.center_id}
                onChange={(e) => setTicket({ ...ticket, center_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 13
                }}
              >
                <option value="">Select a center...</option>
                <option value="CTR-001">Downtown Center</option>
                <option value="CTR-002">North Campus</option>
                <option value="CTR-003">Industrial Park</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Subject
              </label>
              <input
                type="text"
                value={ticket.subject}
                onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                placeholder="Brief description of your issue or question"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 13
                }}
                required
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                Detailed Description
              </label>
              <textarea
                value={ticket.description}
                onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                rows={5}
                placeholder="Please provide detailed information about your issue, including any service impact or urgency"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  fontSize: 13,
                  resize: 'vertical'
                }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={clearForm}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: 'white',
                  color: '#374151',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Clear Form
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#eab308',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Submit Support Ticket
              </button>
            </div>
          </form>
        </div>

        {/* Support Information */}
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Customer Support Info */}
          <div className="ui-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#eab308' }}>
              Customer Support
            </h4>
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Service Support</div>
                <div style={{ color: '#6b7280' }}>Service issues and quality concerns</div>
                <div style={{ color: '#eab308', fontWeight: 600, marginTop: 2 }}>
                  Response: 4-8 hours
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Account Support</div>
                <div style={{ color: '#6b7280' }}>Billing and account questions</div>
                <div style={{ color: '#eab308', fontWeight: 600, marginTop: 2 }}>
                  Response: Same day
                </div>
              </div>
              
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>Urgent Issues</div>
                <div style={{ color: '#6b7280' }}>Service-critical problems</div>
                <div style={{ color: '#ef4444', fontWeight: 600, marginTop: 2 }}>
                  Response: 2 hours
                </div>
              </div>
            </div>
          </div>

          {/* Account Manager Contact */}
          <div className="ui-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#eab308' }}>
              Your Account Manager
            </h4>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 700,
                color: '#eab308',
                margin: '0 auto 8px',
                border: '2px solid #eab308'
              }}>
                MC
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Michael Chen</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Senior Account Manager</div>
            </div>
            
            <div style={{ display: 'grid', gap: 8 }}>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                background: '#eab308',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                📧 Email Michael
              </button>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                background: 'white',
                color: '#eab308',
                border: '1px solid #eab308',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                📅 Schedule Meeting
              </button>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="ui-card" style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#dc2626' }}>
              Emergency Contact
            </h4>
            <div style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>24/7 Emergency Hotline:</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                (555) 911-HELP
              </div>
              <div style={{ fontSize: 11 }}>
                For service-critical emergencies affecting your operations.
              </div>
            </div>
          </div>

          {/* Help Resources */}
          <div className="ui-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#6b7280' }}>
              Self-Help Resources
            </h4>
            <div style={{ display: 'grid', gap: 8 }}>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                📚 Knowledge Base
              </button>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                📋 Service Guidelines
              </button>
              <button style={{
                width: '100%',
                padding: '8px 12px',
                background: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                📞 Emergency Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}