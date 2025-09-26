# Support Ticket System - Complete Design Document

## Overview
End-to-end support ticket system allowing users to create tickets, admins to manage/resolve them, with real-time updates and comprehensive tracking.

## Database Schema

### Table: `support_tickets`
```sql
CREATE TABLE support_tickets (
  id VARCHAR(50) PRIMARY KEY DEFAULT gen_support_ticket_id(),

  -- Core fields
  subject VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN ('bug_report', 'feature_request', 'general_question', 'account_issue', 'technical_support')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending_review', 'in_progress', 'waiting_on_user', 'escalated', 'resolved', 'closed', 'cancelled')),

  -- User relationships
  submitted_by VARCHAR(50) NOT NULL, -- user_id from users table
  submitted_role VARCHAR(50) NOT NULL, -- role at time of submission (manager, crew, customer, etc)
  assigned_to VARCHAR(50), -- admin_user_id who is handling the ticket
  escalated_to VARCHAR(50), -- manager_id if escalated

  -- Contact info (cached at submission time)
  submitter_name VARCHAR(255) NOT NULL,
  submitter_email VARCHAR(255) NOT NULL,
  submitter_phone VARCHAR(50),

  -- Resolution
  resolution TEXT,
  resolved_by VARCHAR(50),
  resolved_at TIMESTAMP,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  satisfaction_feedback TEXT,

  -- Metadata
  tags TEXT[], -- array of tags for categorization
  attachments JSONB DEFAULT '[]', -- array of attachment URLs/metadata
  internal_notes TEXT, -- admin-only notes

  -- Tracking
  response_time_minutes INTEGER, -- time from open to first response
  resolution_time_minutes INTEGER, -- time from open to resolved
  reopened_count INTEGER DEFAULT 0,
  last_user_activity TIMESTAMP,
  last_admin_activity TIMESTAMP,

  -- Standard timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP,

  -- Indexes
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_submitted_by (submitted_by),
  INDEX idx_tickets_assigned_to (assigned_to),
  INDEX idx_tickets_priority_status (priority, status),
  INDEX idx_tickets_created_at (created_at DESC)
);

-- ID generator function
CREATE OR REPLACE FUNCTION gen_support_ticket_id()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'TKT-' || LPAD(nextval('support_ticket_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE support_ticket_seq START 1;
```

### Table: `support_ticket_messages`
```sql
CREATE TABLE support_ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Message details
  message TEXT NOT NULL,
  sender_id VARCHAR(50) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- internal notes between admins

  -- Attachments
  attachments JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,

  -- Index for fast retrieval
  INDEX idx_messages_ticket_id (ticket_id, created_at)
);
```

### Table: `support_ticket_history`
```sql
CREATE TABLE support_ticket_history (
  id SERIAL PRIMARY KEY,
  ticket_id VARCHAR(50) NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,

  -- Change tracking
  action VARCHAR(50) NOT NULL, -- status_change, priority_change, assignment_change, etc
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(50) NOT NULL,
  changed_by_name VARCHAR(255) NOT NULL,
  notes TEXT,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_history_ticket_id (ticket_id, created_at DESC)
);
```

## Backend API Structure

### File: `apps/backend/server/domains/support/types.ts`
```typescript
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  stepsToReproduce?: string;
  issueType: 'bug_report' | 'feature_request' | 'general_question' | 'account_issue' | 'technical_support';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'pending_review' | 'in_progress' | 'waiting_on_user' | 'escalated' | 'resolved' | 'closed' | 'cancelled';

  submittedBy: string;
  submittedRole: string;
  assignedTo?: string;
  escalatedTo?: string;

  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;

  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  satisfactionRating?: number;
  satisfactionFeedback?: string;

  tags?: string[];
  attachments?: Attachment[];
  internalNotes?: string;

  responseTimeMinutes?: number;
  resolutionTimeMinutes?: number;
  reopenedCount: number;
  lastUserActivity?: Date;
  lastAdminActivity?: Date;

  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface TicketMessage {
  id: number;
  ticketId: string;
  message: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  isInternal: boolean;
  attachments?: Attachment[];
  createdAt: Date;
  editedAt?: Date;
}

export interface Attachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}
```

### File: `apps/backend/server/domains/support/routes.fastify.ts`
```typescript
// User endpoints (all roles)
POST   /api/support/tickets              - Create new ticket
GET    /api/support/tickets              - Get user's tickets (filtered by submittedBy)
GET    /api/support/tickets/:id          - Get ticket details
POST   /api/support/tickets/:id/messages - Add message to ticket
POST   /api/support/tickets/:id/reopen   - Reopen resolved ticket
POST   /api/support/tickets/:id/cancel   - Cancel own ticket
POST   /api/support/tickets/:id/feedback - Submit satisfaction rating

// Admin endpoints
GET    /api/admin/support/tickets        - Get all tickets (with filters)
GET    /api/admin/support/tickets/stats  - Get ticket statistics
PUT    /api/admin/support/tickets/:id    - Update ticket (status, priority, assignment)
POST   /api/admin/support/tickets/:id/assign     - Assign ticket to admin
POST   /api/admin/support/tickets/:id/escalate   - Escalate to manager
POST   /api/admin/support/tickets/:id/resolve    - Resolve ticket with resolution
POST   /api/admin/support/tickets/:id/notes      - Add internal note
GET    /api/admin/support/tickets/:id/history    - Get ticket history
```

### File: `apps/backend/server/domains/support/service.ts`
Key methods:
- `createTicket()` - Creates ticket, sends notification email
- `getUserTickets()` - Returns user's tickets with pagination
- `updateTicketStatus()` - Updates status, logs history, notifies user
- `assignTicket()` - Assigns to admin, logs history
- `resolveTicket()` - Marks resolved, calculates resolution time
- `addMessage()` - Adds message, updates activity timestamps
- `getTicketStats()` - Returns dashboard statistics

## Frontend Integration

### File: `apps/frontend/src/shared/api/support.ts`
```typescript
// API hooks
export const useCreateTicket = () => { /* mutation */ };
export const useMyTickets = () => { /* query */ };
export const useTicketDetails = (ticketId: string) => { /* query */ };
export const useAddTicketMessage = () => { /* mutation */ };
export const useReopenTicket = () => { /* mutation */ };
export const useSubmitFeedback = () => { /* mutation */ };

// Admin hooks
export const useAdminTickets = (filters) => { /* query */ };
export const useTicketStats = () => { /* query */ };
export const useUpdateTicket = () => { /* mutation */ };
export const useAssignTicket = () => { /* mutation */ };
export const useResolveTicket = () => { /* mutation */ };
```

### Updated Components

#### File: `packages/domain-widgets/src/support/SupportSection.tsx`
Updates needed:
- Replace mock `myTickets` with `useMyTickets()` hook
- Connect form submission to `useCreateTicket()` mutation
- Add ticket detail modal/drawer for viewing messages
- Add real-time updates via WebSocket subscription

#### File: `packages/domain-widgets/src/support/AdminSupportSection.tsx`
Updates needed:
- Replace mock data with `useAdminTickets()` and `useTicketStats()`
- Add ticket management modal with:
  - Status updates
  - Assignment controls
  - Resolution form
  - Internal notes
  - Message thread view
- Add bulk actions (assign multiple, close multiple)
- Add export functionality

## Real-time Updates

### WebSocket Events (via existing infrastructure)
```typescript
// Server emits
'ticket:created' - New ticket created
'ticket:updated' - Status/priority/assignment changed
'ticket:message' - New message added
'ticket:resolved' - Ticket resolved

// Client subscribes based on role
- Users: Subscribe to their own tickets
- Admins: Subscribe to all tickets or assigned tickets
```

### File: `apps/backend/server/domains/support/events.ts`
```typescript
export const emitTicketUpdate = (ticketId: string, update: any) => {
  // Emit to submitter
  io.to(`user:${ticket.submittedBy}`).emit('ticket:updated', update);
  // Emit to assigned admin
  if (ticket.assignedTo) {
    io.to(`admin:${ticket.assignedTo}`).emit('ticket:updated', update);
  }
  // Emit to admin dashboard
  io.to('admin:support').emit('ticket:updated', update);
};
```

## User Flow & Edge Cases

### User Creates Ticket
1. User clicks "Contact Support" tab
2. Fills out form (type, priority, subject, description, steps)
3. System validates:
   - Required fields present
   - Subject length <= 100 chars
   - Description length <= 500 chars
4. On submit:
   - Create ticket in DB with status='open'
   - Generate ticket ID (TKT-000001)
   - Send confirmation email to user
   - Emit WebSocket event for admins
   - Show success message with ticket ID
5. Edge cases:
   - Network failure: Show retry option, save form data locally
   - Duplicate detection: Check for similar recent tickets, warn user
   - Rate limiting: Max 5 tickets per hour per user

### Admin Manages Tickets
1. Admin views Support dashboard
2. Sees overview cards (Open, Pending, Resolved Today, Escalated)
3. Clicks card or uses dropdown to filter tickets
4. Clicks ticket to open management modal
5. Available actions:
   - **Update Status**: Validates status transitions (e.g., can't go from resolved to open)
   - **Assign**: Only to active admin users
   - **Escalate**: Only to managers with escalation permissions
   - **Resolve**: Requires resolution text, auto-calculates resolution time
   - **Add Message**: Public (user sees) or internal (admin-only)
6. Edge cases:
   - Concurrent edits: Use optimistic locking, show conflict warning
   - Assignment conflicts: Check if assignee is available/not overloaded
   - Auto-escalation: Critical tickets idle > 1 hour auto-escalate

### Resolution Flow
1. Admin clicks "Resolve Ticket"
2. Modal shows:
   - Resolution text field (required)
   - Template suggestions based on issue type
   - Option to send follow-up email
3. On submit:
   - Update status to 'resolved'
   - Set resolution text and resolved_by
   - Calculate resolution_time_minutes
   - Send resolution email to user
   - Start 48-hour feedback window
4. User receives email with:
   - Resolution summary
   - Link to reopen if not satisfied
   - Link to provide feedback/rating
5. Edge cases:
   - Reopen limit: Max 3 reopens per ticket
   - Auto-close: Resolved tickets auto-close after 7 days
   - Feedback reminder: Send after 24 hours if no feedback

### Message Thread
1. Both user and admin can add messages
2. Messages are append-only (no delete, only edit own within 5 min)
3. Admin can mark messages as internal (user won't see)
4. File attachments:
   - Max 5 files per message
   - Max 10MB per file
   - Allowed types: images, PDFs, text files
   - Store in S3/cloud storage, reference in DB
5. Edge cases:
   - Long threads: Paginate after 20 messages
   - Notification fatigue: Batch notifications (max 1 per hour)
   - Offensive content: Auto-flag for review

## Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. Database tables and migrations
2. Basic CRUD APIs (create, list, get)
3. Frontend integration for ticket creation
4. Admin view (read-only)

### Phase 2: Management Features (Week 2)
1. Admin update APIs (status, assignment)
2. Message thread functionality
3. Admin management modal
4. Email notifications

### Phase 3: Advanced Features (Week 3)
1. WebSocket real-time updates
2. File attachments
3. Satisfaction ratings
4. Statistics and reporting
5. Export functionality

### Phase 4: Optimizations (Week 4)
1. Search and filtering
2. Bulk actions
3. Auto-escalation rules
4. Performance optimizations
5. Analytics dashboard

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**:
   - Users can only see/edit their own tickets
   - Admins have full access
   - Managers can see escalated tickets
3. **Rate Limiting**:
   - Ticket creation: 5 per hour
   - Messages: 20 per hour
   - API calls: 100 per minute
4. **Input Validation**:
   - Sanitize HTML in messages
   - Validate file uploads
   - SQL injection prevention via parameterized queries
5. **Data Privacy**:
   - PII encryption at rest
   - Audit logs for admin actions
   - GDPR compliance (right to deletion)

## Testing Strategy

1. **Unit Tests**: Service methods, validators
2. **Integration Tests**: API endpoints with DB
3. **E2E Tests**: Full user flows
4. **Load Tests**: Concurrent ticket creation
5. **Security Tests**: SQL injection, XSS attempts

## Monitoring & Metrics

Track via existing reporting system:
- Tickets created per day/week/month
- Average response time
- Average resolution time
- Satisfaction ratings
- Escalation rate
- Admin workload distribution
- Most common issue types
- Peak support hours

## Existing Files to Leverage

1. **Authentication**: `apps/backend/server/core/auth/` - JWT validation
2. **Database**: `apps/backend/server/db/` - Connection pooling
3. **WebSocket**: Check for existing WebSocket setup in core
4. **Email**: Look for email service in core/services
5. **File Upload**: Check if exists in other domains (attachments)
6. **Reporting**: `apps/backend/server/domains/reports/` - Statistics queries

## Notes for Implementation

- Start with migrations to create tables
- Use existing patterns from other domains (orders, reports)
- Ensure consistent error handling
- Add comprehensive logging
- Consider timezone handling for global users
- Plan for data retention (archive old tickets)
- Add feature flags for gradual rollout