/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

import React, { useMemo, useState } from 'react';
import { OverviewSection } from '../overview';
import { DataTable, StatusBadge } from '@cks/ui';
import type { SupportTicket } from './SupportSection';

interface AdminSupportSectionProps {
  primaryColor?: string;
  tickets?: SupportTicket[];
  onTicketClick?: (ticket: SupportTicket) => void;
}

const VIEW_KEYS = ['Open Tickets', 'In Progress', 'Resolved Today', 'Escalated'] as const;
type ViewKey = typeof VIEW_KEYS[number];

function isToday(value?: string | null): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const now = new Date();
  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
}

function normalizeStatus(ticket: SupportTicket): string {
  return String(ticket.statusCode || ticket.status || '').trim().toLowerCase();
}

const AdminSupportSection: React.FC<AdminSupportSectionProps> = ({
  primaryColor = '#6366f1',
  tickets = [],
  onTicketClick,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ViewKey>('Open Tickets');

  const ticketGroups = useMemo(() => {
    const open = tickets.filter((ticket) => normalizeStatus(ticket) === 'open');
    const inProgress = tickets.filter((ticket) => normalizeStatus(ticket) === 'in_progress');
    const resolvedToday = tickets.filter((ticket) => {
      const status = normalizeStatus(ticket);
      const dateValue = ticket.resolvedAt || ticket.lastUpdated || ticket.dateCreated;
      return status === 'resolved' && isToday(dateValue);
    });
    const escalated = tickets.filter((ticket) => normalizeStatus(ticket) === 'escalated');
    return { open, inProgress, resolvedToday, escalated };
  }, [tickets]);

  const overviewCards = [
    { id: 'open', title: 'Open Tickets', dataKey: 'openTickets', color: 'orange' },
    { id: 'progress', title: 'In Progress', dataKey: 'inProgress', color: 'blue' },
    { id: 'resolved', title: 'Resolved Today', dataKey: 'resolvedToday', color: 'green' },
    { id: 'escalated', title: 'Escalated', dataKey: 'escalated', color: 'red' },
  ];

  const overviewData = useMemo(() => ({
    openTickets: ticketGroups.open.length,
    inProgress: ticketGroups.inProgress.length,
    resolvedToday: ticketGroups.resolvedToday.length,
    escalated: ticketGroups.escalated.length,
  }), [ticketGroups]);

  const groupedData = useMemo<Record<ViewKey, SupportTicket[]>>(() => ({
    'Open Tickets': ticketGroups.open,
    'In Progress': ticketGroups.inProgress,
    'Resolved Today': ticketGroups.resolvedToday,
    'Escalated': ticketGroups.escalated,
  }), [ticketGroups]);

  const activeRows = groupedData[selectedCategory];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <OverviewSection cards={overviewCards} data={overviewData} />
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>Ticket Management</h3>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value as ViewKey)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: '#ffffff',
              minWidth: 220,
            }}
          >
            {VIEW_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>

          <button
            type="button"
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Export Report
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0, padding: '16px 20px 0' }}>
              {selectedCategory} ({activeRows.length})
            </h4>

            {activeRows.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 8px 0' }}>
                  No {selectedCategory.toLowerCase()} found
                </p>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
                  Support tickets will appear here when available.
                </p>
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: 'ticketId', label: 'TICKET ID', clickable: true },
                  { key: 'subject', label: 'SUBJECT' },
                  { key: 'submittedBy', label: 'SUBMITTED BY' },
                  {
                    key: 'priority',
                    label: 'PRIORITY',
                    render: (value) => (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{value}</span>
                    ),
                  },
                  {
                    key: 'status',
                    label: 'STATUS',
                    render: (_, row) => <StatusBadge status={(row as any).statusCode || 'open'} variant="badge" />,
                  },
                  { key: 'assignedTo', label: 'ASSIGNED TO' },
                  { key: 'dateSubmitted', label: 'DATE SUBMITTED' },
                  { key: 'lastUpdate', label: 'LAST UPDATE' },
                ]}
                data={activeRows.map((ticket) => ({
                  ticketId: ticket.ticketId,
                  subject: ticket.subject,
                  submittedBy: ticket.submittedBy || ticket.ticketId.split('-TKT-')[0] || 'N/A',
                  priority: ticket.priority,
                  status: ticket.status,
                  statusCode: normalizeStatus(ticket),
                  assignedTo: ticket.assignedTo || 'Unassigned',
                  dateSubmitted: ticket.dateCreated,
                  lastUpdate: ticket.lastUpdated,
                }))}
                showSearch
                searchPlaceholder="Search tickets..."
                maxItems={10}
                onRowClick={(row) => {
                  const ticket = tickets.find((item) => item.ticketId === row.ticketId);
                  if (ticket && onTicketClick) {
                    onTicketClick(ticket);
                  }
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

