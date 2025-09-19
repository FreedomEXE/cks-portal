import React, { useState } from 'react';
import TabSection from '../../../ui/src/layout/TabSection';
import DataTable from '../../../ui/src/tables/DataTable';

interface FAQ {
  question: string;
  answer: string;
}

interface SupportTicket {
  ticketId: string;
  subject: string;
  issueType: string;
  priority: string;
  status: string;
  dateCreated: string;
  lastUpdated: string;
}

interface SupportSectionProps {
  role?: string;
  primaryColor?: string;
}

const SupportSection: React.FC<SupportSectionProps> = ({
  role = 'warehouse',
  primaryColor = '#8b5cf6'
}) => {
  const [activeTab, setActiveTab] = useState('knowledge');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketForm, setTicketForm] = useState({
    issueType: '',
    priority: 'Medium',
    subject: '',
    description: '',
    stepsToReproduce: ''
  });

  // FAQ data based on role
  const getFAQs = (role: string): FAQ[] => {
    switch (role) {
      case 'manager':
        return [
          {
            question: 'How do I create a service from an order?',
            answer: 'Navigate to Orders → Service Orders and click "Create Service" on approved service orders to transform them into active services.'
          },
          {
            question: 'How can I assign crew to services?',
            answer: 'Use the Services tab to manage crew assignments and monitor service completion status.'
          },
          {
            question: 'Where do I view ecosystem performance?',
            answer: 'Check the Dashboard overview cards and Reports tab for comprehensive ecosystem analytics and performance metrics.'
          },
          {
            question: 'How do I monitor all orders across the system?',
            answer: 'The Orders tab provides a system-wide view of all product and service orders across all centers and roles.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your contact details, settings, and management preferences.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
      case 'crew':
        return [
          {
            question: 'How do I request products from warehouse?',
            answer: 'Navigate to Orders tab and click "Request Products" to submit product order requests to the warehouse.'
          },
          {
            question: 'How can I view my assigned services?',
            answer: 'Check the Services tab to see services assigned to you and update their completion status.'
          },
          {
            question: 'Where do I accept or deny service assignments?',
            answer: 'Service assignments appear in your Services tab with Accept/Deny buttons for pending assignments.'
          },
          {
            question: 'How do I track my product order status?',
            answer: 'Use the Orders tab to monitor the status of your product requests and view delivery details.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your contact details, certifications, and availability.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
      case 'center':
        return [
          {
            question: 'How do I request services for customers?',
            answer: 'Navigate to Orders tab and click "Request Service" to submit service requests that will go through the approval chain.'
          },
          {
            question: 'How can I order products for my center?',
            answer: 'Use the Orders tab and click "Request Products" to submit product orders to the warehouse.'
          },
          {
            question: 'Where do I view my ecosystem connections?',
            answer: 'Check the Ecosystem tab to see your network of contractors, customers, and business relationships.'
          },
          {
            question: 'How do I monitor order status?',
            answer: 'The Orders tab shows all your submitted orders with real-time status updates and approval progress.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your center details, contact information, and service offerings.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
      case 'contractor':
        return [
          {
            question: 'How do I approve service orders?',
            answer: 'Navigate to Orders → Service Orders to review and approve service requests from customers before they go to management.'
          },
          {
            question: 'How can I request products?',
            answer: 'Use the Orders tab and click "Request Products" to submit product orders through the approval workflow.'
          },
          {
            question: 'Where do I view my customer relationships?',
            answer: 'Check the Ecosystem tab to see your connected customers and business network details.'
          },
          {
            question: 'How do I track order approvals?',
            answer: 'The Orders tab displays the approval workflow for all your orders with real-time status updates.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your contractor details, services offered, and contact information.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
      case 'customer':
        return [
          {
            question: 'How do I request cleaning services?',
            answer: 'Navigate to Orders tab and click "Request Service" to submit service requests that will be processed through contractors.'
          },
          {
            question: 'How can I order cleaning supplies?',
            answer: 'Use the Orders tab and click "Request Products" to submit product orders through the approval workflow.'
          },
          {
            question: 'Where do I view my service providers?',
            answer: 'Check the Ecosystem tab to see your connected contractors and centers in your business network.'
          },
          {
            question: 'How do I track my order status?',
            answer: 'The Orders tab shows all your requests with approval status and expected completion timelines.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your business details, contact information, and service preferences.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
      default: // warehouse
        return [
          {
            question: 'How do I schedule a new delivery?',
            answer: 'Navigate to Deliveries → Pending and click "Delivered" on any pending delivery to complete it.'
          },
          {
            question: 'How can I view inventory levels?',
            answer: 'Go to Inventory tab to see current stock levels, low inventory alerts, and archived products.'
          },
          {
            question: 'Where do I manage product orders?',
            answer: 'Use the Orders tab to accept, deny, or view details on product order requests.'
          },
          {
            question: 'How do I access reports and analytics?',
            answer: 'Check the Reports tab for all analytics, reports, and performance metrics.'
          },
          {
            question: 'How do I update my profile information?',
            answer: 'Go to My Profile tab to update your contact details, settings, and preferences.'
          },
          {
            question: 'What should I do if I encounter a technical issue?',
            answer: 'Submit a support ticket using the Contact Support tab with detailed information about the problem.'
          }
        ];
    }
  };

  const faqs = getFAQs(role);

  // Mock tickets data
  const myTickets: SupportTicket[] = [
    {
      ticketId: 'TKT-001',
      subject: 'Cannot update inventory levels',
      issueType: 'Bug Report',
      priority: 'High',
      status: 'In Progress',
      dateCreated: '2025-09-18',
      lastUpdated: '2025-09-19'
    },
    {
      ticketId: 'TKT-002',
      subject: 'Need help with delivery scheduling',
      issueType: 'General Question',
      priority: 'Medium',
      status: 'Resolved',
      dateCreated: '2025-09-15',
      lastUpdated: '2025-09-16'
    }
  ];

  const handleSubmitTicket = () => {
    console.log('Submitting ticket:', ticketForm);
    // Reset form
    setTicketForm({
      issueType: '',
      priority: 'Medium',
      subject: '',
      description: '',
      stepsToReproduce: ''
    });
    alert('Support ticket submitted successfully!');
  };

  const handleClearForm = () => {
    setTicketForm({
      issueType: '',
      priority: 'Medium',
      subject: '',
      description: '',
      stepsToReproduce: ''
    });
  };

  const renderKnowledgeBase = () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '20px'
      }}>
        Frequently Asked Questions
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '8px'
            }}>
              {faq.question}
            </h4>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
              margin: 0
            }}>
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMyTickets = () => (
    <div style={{ padding: '0 24px 24px' }}>
      <DataTable
        columns={[
          { key: 'ticketId', label: 'TICKET ID', clickable: true },
          { key: 'subject', label: 'SUBJECT' },
          { key: 'issueType', label: 'ISSUE TYPE' },
          { key: 'priority', label: 'PRIORITY' },
          {
            key: 'status',
            label: 'STATUS',
            render: (value) => (
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: value === 'Resolved' ? '#dcfce7' : value === 'In Progress' ? '#fef3c7' : '#fee2e2',
                color: value === 'Resolved' ? '#16a34a' : value === 'In Progress' ? '#d97706' : '#dc2626'
              }}>
                {value}
              </span>
            )
          },
          { key: 'dateCreated', label: 'DATE CREATED' },
          { key: 'lastUpdated', label: 'LAST UPDATED' }
        ]}
        data={myTickets}
        showSearch={false}
        externalSearchQuery={searchQuery}
        maxItems={10}
        onRowClick={(row) => console.log('View ticket:', row)}
      />
    </div>
  );

  const renderContactSupport = () => (
    <div style={{ padding: '24px' }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '20px'
      }}>
        Submit Support Request
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Issue Type and Priority Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Issue Type
            </label>
            <select
              value={ticketForm.issueType}
              onChange={(e) => setTicketForm({...ticketForm, issueType: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Select issue type</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="General Question">General Question</option>
              <option value="Account Issue">Account Issue</option>
              <option value="Technical Support">Technical Support</option>
            </select>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Priority Level
            </label>
            <select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Subject ({ticketForm.subject.length}/100)
            </label>
            <input
              type="text"
              value={ticketForm.subject}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setTicketForm({...ticketForm, subject: e.target.value});
                }
              }}
              placeholder="Brief description (max 100 chars)"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div></div>
        </div>

        {/* Description and Steps Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Detailed Description ({ticketForm.description.length}/500)
            </label>
            <textarea
              value={ticketForm.description}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setTicketForm({...ticketForm, description: e.target.value});
                }
              }}
              placeholder="Detailed information about your issue (max 500 chars)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
              Steps to Reproduce ({ticketForm.stepsToReproduce.length}/300)
            </label>
            <textarea
              value={ticketForm.stepsToReproduce}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setTicketForm({...ticketForm, stepsToReproduce: e.target.value});
                }
              }}
              placeholder="Steps to reproduce the issue (max 300 chars)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={handleClearForm}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
          <button
            onClick={handleSubmitTicket}
            disabled={!ticketForm.issueType || !ticketForm.subject || !ticketForm.description}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              backgroundColor: ticketForm.issueType && ticketForm.subject && ticketForm.description ? primaryColor : '#e5e7eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: ticketForm.issueType && ticketForm.subject && ticketForm.description ? 'pointer' : 'not-allowed'
            }}
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <TabSection
      tabs={[
        { id: 'knowledge', label: 'Knowledge Base', count: faqs.length },
        { id: 'tickets', label: 'My Tickets', count: myTickets.length },
        { id: 'contact', label: 'Contact Support' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      description={
        activeTab === 'knowledge' ? 'Find answers to common questions and guidance' :
        activeTab === 'tickets' ? 'View and track your support ticket history' :
        'Submit a new support request for assistance'
      }
      searchPlaceholder={
        activeTab === 'knowledge' ? 'Search knowledge base...' :
        activeTab === 'tickets' ? 'Search tickets...' :
        undefined
      }
      onSearch={activeTab !== 'contact' ? setSearchQuery : undefined}
      primaryColor={primaryColor}
      contentPadding="flush"
    >
      {activeTab === 'knowledge' && renderKnowledgeBase()}
      {activeTab === 'tickets' && renderMyTickets()}
      {activeTab === 'contact' && renderContactSupport()}
    </TabSection>
  );
};

export default SupportSection;