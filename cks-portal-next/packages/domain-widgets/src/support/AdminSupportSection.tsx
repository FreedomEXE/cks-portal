import React, { useState } from 'react';
import OverviewSection from '../overview';
import DataTable from '../../../ui/src/tables/DataTable';

interface AdminSupportSectionProps {
  primaryColor?: string;
}

const AdminSupportSection: React.FC<AdminSupportSectionProps> = ({
  primaryColor = '#6366f1'
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Open Tickets');

  // Admin support overview cards
  const overviewCards = [
    { id: 'open', title: 'Open Tickets', dataKey: 'openTickets', color: 'orange' },
    { id: 'pending', title: 'Pending Review', dataKey: 'pendingReview', color: 'blue' },
    { id: 'resolved', title: 'Resolved Today', dataKey: 'resolvedToday', color: 'green' },
    { id: 'escalated', title: 'Escalated', dataKey: 'escalated', color: 'red' }
  ];

  // Mock data for overview cards
  const overviewData = {
    openTickets: 0,
    pendingReview: 0,
    resolvedToday: 0,
    escalated: 0
  };

  // Mock tickets data for different categories
  const ticketsData = {
    'Open Tickets': [],
    'Pending Review': [],
    'Resolved Today': [],
    'Escalated': []
  };

  const handleCardClick = (cardTitle: string) => {
    setSelectedCategory(cardTitle);
  };

  const handleCreateTicket = () => {
    console.log('Creating new ticket...');
    // This would open a modal or navigate to create ticket form
  };

  const handleExportReport = () => {
    console.log('Exporting support report...');
    // This would generate and download a report
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Overview Cards */}
      <div style={{ marginBottom: '32px' }}>
        <OverviewSection
          cards={overviewCards}
          data={overviewData}
          onCardClick={handleCardClick}
          primaryColor={primaryColor}
        />
      </div>

      {/* Ticket Management Section */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#111827',
            margin: 0
          }}>
            Ticket Management
          </h3>
        </div>

        {/* Category Dropdown and Action Buttons */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: '#ffffff',
              minWidth: '200px'
            }}
          >
            <option value="Open Tickets">Open Tickets</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Resolved Today">Resolved Today</option>
            <option value="Escalated">Escalated</option>
          </select>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCreateTicket}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: primaryColor,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Create New Ticket
            </button>
            <button
              onClick={handleExportReport}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div style={{ padding: '24px' }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 16px 0',
              padding: '16px 20px 0'
            }}>
              {selectedCategory} ({ticketsData[selectedCategory as keyof typeof ticketsData].length})
            </h4>

            {ticketsData[selectedCategory as keyof typeof ticketsData].length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '16px',
                  color: '#9ca3af',
                  margin: '0 0 8px 0'
                }}>
                  No {selectedCategory.toLowerCase()} found
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  Support tickets will appear here when available.
                </p>
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: 'ticketId', label: 'TICKET ID', clickable: true },
                  { key: 'subject', label: 'SUBJECT' },
                  { key: 'submittedBy', label: 'SUBMITTED BY' },
                  { key: 'priority', label: 'PRIORITY' },
                  { key: 'status', label: 'STATUS' },
                  { key: 'assignedTo', label: 'ASSIGNED TO' },
                  { key: 'dateSubmitted', label: 'DATE SUBMITTED' },
                  { key: 'lastUpdate', label: 'LAST UPDATE' }
                ]}
                data={ticketsData[selectedCategory as keyof typeof ticketsData]}
                showSearch={true}
                searchPlaceholder="Search tickets..."
                maxItems={10}
                onRowClick={(row) => console.log('View ticket:', row)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportSection;