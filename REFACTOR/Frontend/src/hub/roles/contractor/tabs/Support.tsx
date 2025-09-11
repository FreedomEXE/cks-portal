/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * Support.tsx
 * 
 * Description: Universal support center with help desk integration
 * Function: Provide access to documentation, help tickets, and support requests
 * Importance: Critical - Enables users to get help and submit support requests
 * Connects to: Support API endpoints, admin hub ticket system
 * 
 * Notes: Universal implementation used across all hubs.
 *        Includes knowledge base, ticket system, and contact options.
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
  steps_to_reproduce: string;
}

export default function Support({ userId, config, features, api }: SupportProps) {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'tickets' | 'contact'>('knowledge');
  const [ticket, setTicket] = useState<SupportTicket>({
    issue_type: 'bug',
    priority: 'medium',
    subject: '',
    description: '',
    steps_to_reproduce: ''
  });

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticket.subject || !ticket.description) {
      alert('Please fill in subject and description');
      return;
    }

    // Mock ticket submission - will connect to admin hub
    const ticketId = `TKT-${Date.now()}`;
    console.log('Submitting support ticket to admin hub:', { ...ticket, ticketId, userId });
    alert(`Support ticket ${ticketId} submitted successfully!\n\nYou will receive an email confirmation shortly.`);
    
    // Clear form
    setTicket({
      issue_type: 'bug',
      priority: 'medium',
      subject: '',
      description: '',
      steps_to_reproduce: ''
    });
  };

  const handleClearForm = () => {
    setTicket({
      issue_type: 'bug',
      priority: 'medium',
      subject: '',
      description: '',
      steps_to_reproduce: ''
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Support Center</h2>
      
      {/* Support Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'knowledge' as const, label: 'Knowledge Base' },
          { key: 'tickets' as const, label: 'My Tickets' },
          { key: 'contact' as const, label: 'Contact Support' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              background: activeTab === tab.key ? '#3b7af7' : 'white',
              color: activeTab === tab.key ? 'white' : '#111827',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ui-card" style={{ padding: 16 }}>
        {activeTab === 'knowledge' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Frequently Asked Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { q: 'How do I schedule a new service request?', a: 'Navigate to Orders → Needs Scheduling and click "Schedule" on any pending request.' },
                { q: 'How can I view my ecosystem network?', a: 'Go to My Ecosystem tab to see your business network and relationships.' },
                { q: 'Where do I manage my services?', a: 'Use the My Services tab to add, edit, or remove services you offer.' },
                { q: 'How do I access reports and feedback?', a: 'Check the Reports tab for all analytics, reports, and customer feedback.' },
                { q: 'How do I update my profile information?', a: 'Go to My Profile tab to update your contact details, settings, and preferences.' },
                { q: 'What should I do if I encounter a technical issue?', a: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.' }
              ].map((faq, idx) => (
                <div key={idx} style={{ padding: 12, background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111827' }}>
                    {faq.q}
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: '#f9fafb', borderRadius: 8 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎫</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>No Support Tickets</div>
            <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
              Your submitted support tickets will appear here.<br />
              You can track status and responses from our support team.
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Submit Support Request</h3>
            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    <option value="bug">Bug Report</option>
                    <option value="how_to">How-To Question</option>
                    <option value="feature_question">Feature Question</option>
                    <option value="account_issue">Account Issue</option>
                    <option value="business_support">Business Support</option>
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
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={ticket.subject}
                  onChange={(e) => setTicket({ ...ticket, subject: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6, 
                    fontSize: 13 
                  }}
                  placeholder="Brief description of your issue or question"
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
                  maxLength={10000}
                  rows={5}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6, 
                    fontSize: 13,
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Please provide detailed information about your issue, including any error messages or specific problems you're experiencing"
                  required
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#374151' }}>
                  Steps to Reproduce (if applicable)
                </label>
                <textarea
                  value={ticket.steps_to_reproduce}
                  onChange={(e) => setTicket({ ...ticket, steps_to_reproduce: e.target.value })}
                  maxLength={5000}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 6, 
                    fontSize: 13,
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="If this is a bug report, please list the specific steps to reproduce the issue"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
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
                  onClick={handleClearForm}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#3b7af7',
                    color: 'white',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
            
            <div style={{ marginTop: 24, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #0ea5e9' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0c4a6e', marginBottom: 8 }}>
                Need immediate assistance?
              </div>
              <div style={{ fontSize: 12, color: '#075985', lineHeight: 1.5 }}>
                For urgent issues, call our support hotline: <strong>(555) 123-4567</strong><br />
                Email: <strong>support@cks-portal.com</strong><br />
                Hours: Monday - Friday, 8:00 AM - 6:00 PM EST
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}