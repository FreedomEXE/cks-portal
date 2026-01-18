import React, { useMemo, useState } from 'react';
import { OverviewSection } from '../overview';
import { DataTable } from '@cks/ui';
import type { SupportTicket } from './SupportSection';

interface AdminSupportSectionProps {
  primaryColor?: string;
  tickets?: SupportTicket[];
  onTicketClick?: (ticket: SupportTicket) => void;
}

const AdminSupportSection: React.FC<AdminSupportSectionProps> = ({
  primaryColor = '#6366f1',
  tickets = [],
  onTicketClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Open Tickets');

  const isToday = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return false;
    }
    const now = new Date();
    return (
      parsed.getFullYear() === now.getFullYear() &&
      parsed.getMonth() === now.getMonth() &&
      parsed.getDate() === now.getDate()
    );
  };

  const ticketGroups = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'Open');
    const pending = tickets.filter((t) => t.status === 'In Progress');
    const resolvedToday = tickets.filter((t) => t.status === 'Resolved' && isToday(t.lastUpdated));
    const escalated = tickets.filter((t) =>
      (t.priority === 'High' || t.priority === 'Critical') && t.status !== 'Resolved'
    );
    return {
      open,
      pending,
      resolvedToday,
      escalated,
    };
  }, [tickets]);

  // Admin support overview cards
  const overviewCards = [
    { id: 'open', title: 'Open Tickets', dataKey: 'openTickets', color: 'orange' },
    { id: 'pending', title: 'Pending Review', dataKey: 'pendingReview', color: 'blue' },
    { id: 'resolved', title: 'Resolved Today', dataKey: 'resolvedToday', color: 'green' },
    { id: 'escalated', title: 'Escalated', dataKey: 'escalated', color: 'red' }
  ];

  const overviewData = useMemo(() => ({
    openTickets: ticketGroups.open.length,
    pendingReview: ticketGroups.pending.length,
    resolvedToday: ticketGroups.resolvedToday.length,
    escalated: ticketGroups.escalated.length
  }), [ticketGroups]);

  const ticketsData = useMemo(() => ({
    'Open Tickets': ticketGroups.open,
    'Pending Review': ticketGroups.pending,
    'Resolved Today': ticketGroups.resolvedToday,
    'Escalated': ticketGroups.escalated
  }), [ticketGroups]);

  const handleCardClick = (cardTitle: string) => {
    setSelectedCategory(cardTitle);
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
                  data={ticketsData[selectedCategory as keyof typeof ticketsData].map((ticket) => ({
                    ticketId: ticket.ticketId,
                    subject: ticket.subject,
                    submittedBy: 'N/A',
                    priority: ticket.priority,
                    status: ticket.status,
                    assignedTo: 'Unassigned',
                    dateSubmitted: ticket.dateCreated,
                    lastUpdate: ticket.lastUpdated,
                  }))}
                  showSearch={true}
                  searchPlaceholder="Search tickets..."
                  maxItems={10}
                  onRowClick={(row) => {
                    if (onTicketClick) {
                      const ticket = tickets.find((t) => t.ticketId === row.ticketId);
                      if (ticket) {
                        onTicketClick(ticket);
                        return;
                      }
                    }
                    console.log('View ticket:', row);
                  }}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportSection;
