/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Support Tickets System Migration
-- Creates technical support system separate from reports/feedback

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    ticket_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(60) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    user_hub VARCHAR(20) NOT NULL, -- which hub they were using
    issue_type VARCHAR(20) NOT NULL CHECK (issue_type IN ('bug', 'error', 'how_to', 'feature_question', 'other')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    browser_info VARCHAR(500),
    current_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'waiting_user', 'resolved', 'closed')),
    assigned_admin VARCHAR(60),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Support Messages Table (for conversation thread)
CREATE TABLE IF NOT EXISTS support_messages (
    message_id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(20) NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id VARCHAR(60) NOT NULL,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- admin-only internal notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_hub ON support_tickets(user_hub);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at);

