/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_customer_activity_logs.sql
 * 
 * Description: Activity logging system for tracking customer actions and service interactions
 * Function: Track auditable customer actions and service-related events
 * Importance: Supports audits, service tracking, and customer engagement analytics
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system focused on customer service interactions
 */

-- System activity logs - comprehensive tracking for all customer actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'customer', 'manager', etc.
    action_type TEXT NOT NULL, -- 'service_request', 'order_view', 'feedback_submit', etc.
    action_category TEXT NOT NULL, -- 'requests', 'orders', 'billing', 'feedback', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'service_request', 'order', 'invoice', 'feedback', etc.
    entity_id TEXT, -- ID of the affected entity
    before_state JSONB, -- State before the action (for updates)
    after_state JSONB, -- State after the action (for updates)
    metadata JSONB, -- Additional context data
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT, -- For tracing requests across services
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration_ms INTEGER, -- How long the action took
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer-specific activity tracking for engagement and service analytics
CREATE TABLE IF NOT EXISTS customer_activity_summary (
    id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    service_requests_created INTEGER DEFAULT 0,
    orders_viewed INTEGER DEFAULT 0,
    invoices_viewed INTEGER DEFAULT 0,
    feedback_submitted INTEGER DEFAULT 0,
    support_tickets_created INTEGER DEFAULT 0,
    profile_updates INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    session_duration_minutes INTEGER DEFAULT 0,
    pages_visited INTEGER DEFAULT 0,
    documents_downloaded INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, date)
);

-- Customer service engagement tracking
CREATE TABLE IF NOT EXISTS customer_service_engagement (
    engagement_id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL, -- References users(user_id)
    engagement_type TEXT NOT NULL, -- 'service_request', 'order_tracking', 'billing_inquiry', etc.
    engagement_channel TEXT DEFAULT 'web' CHECK (engagement_channel IN ('web', 'mobile', 'phone', 'email', 'chat')),
    service_request_id INTEGER, -- References customer_service_requests(request_id)
    order_id INTEGER, -- References customer_order_tracking(tracking_id)
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    session_duration_minutes INTEGER,
    pages_viewed TEXT[],
    actions_taken JSONB, -- Detailed actions during session
    goal_achieved BOOLEAN,
    goal_description TEXT,
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback_provided TEXT,
    issues_encountered TEXT,
    help_articles_viewed TEXT[],
    support_contacted BOOLEAN DEFAULT FALSE,
    conversion_event TEXT, -- 'service_request_created', 'payment_made', etc.
    referral_source TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer notifications and communications log
CREATE TABLE IF NOT EXISTS customer_notifications (
    id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL, -- References users(user_id)
    notification_type TEXT NOT NULL, -- 'service_reminder', 'billing_notice', 'order_update', etc.
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'service', 'billing', 'orders', 'marketing', 'system'
    related_entity_type TEXT,
    related_entity_id TEXT,
    delivery_channel TEXT DEFAULT 'app' CHECK (delivery_channel IN ('app', 'email', 'sms', 'push')),
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    delivery_attempts INTEGER DEFAULT 0,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    personalization_data JSONB,
    tracking_data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer service interaction history
CREATE TABLE IF NOT EXISTS customer_service_interactions (
    interaction_id SERIAL PRIMARY KEY,
    customer_id TEXT NOT NULL, -- References users(user_id)
    interaction_type TEXT NOT NULL, -- 'phone_call', 'email', 'chat', 'in_person', 'video_call'
    interaction_direction TEXT DEFAULT 'inbound' CHECK (interaction_direction IN ('inbound', 'outbound')),
    staff_member TEXT, -- References users(user_id) for staff who handled interaction
    duration_minutes INTEGER,
    interaction_summary TEXT,
    customer_issue_category TEXT, -- 'service_question', 'billing_issue', 'complaint', 'compliment'
    resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'escalated', 'follow_up_needed')),
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    internal_notes TEXT,
    tags TEXT[],
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system_activity_customer_date ON system_activity(user_id, created_at DESC) WHERE user_role = 'customer';
CREATE INDEX IF NOT EXISTS idx_system_activity_customer_category ON system_activity(action_category, created_at DESC) WHERE user_role = 'customer';
CREATE INDEX IF NOT EXISTS idx_system_activity_customer_entity ON system_activity(entity_type, entity_id) WHERE user_role = 'customer';
CREATE INDEX IF NOT EXISTS idx_system_activity_customer_session ON system_activity(session_id) WHERE user_role = 'customer';

-- Customer summary indexes
CREATE INDEX IF NOT EXISTS idx_customer_activity_summary_customer_date ON customer_activity_summary(customer_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_customer_activity_summary_date ON customer_activity_summary(date DESC);

-- Service engagement indexes
CREATE INDEX IF NOT EXISTS idx_customer_service_engagement_customer ON customer_service_engagement(customer_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_customer_service_engagement_type ON customer_service_engagement(engagement_type);
CREATE INDEX IF NOT EXISTS idx_customer_service_engagement_channel ON customer_service_engagement(engagement_channel);
CREATE INDEX IF NOT EXISTS idx_customer_service_engagement_conversion ON customer_service_engagement(conversion_event) WHERE conversion_event IS NOT NULL;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer ON customer_notifications(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_type ON customer_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_priority ON customer_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_delivery_status ON customer_notifications(delivery_status);
CREATE INDEX IF NOT EXISTS idx_customer_notifications_unread ON customer_notifications(customer_id, read_at) WHERE read_at IS NULL;

-- Service interactions indexes
CREATE INDEX IF NOT EXISTS idx_customer_service_interactions_customer ON customer_service_interactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_service_interactions_staff ON customer_service_interactions(staff_member);
CREATE INDEX IF NOT EXISTS idx_customer_service_interactions_type ON customer_service_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_customer_service_interactions_resolution ON customer_service_interactions(resolution_status);

-- Update trigger for customer activity summary
CREATE OR REPLACE FUNCTION update_customer_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert daily summary for customers
    IF NEW.user_role = 'customer' THEN
        INSERT INTO customer_activity_summary (
            customer_id, 
            date, 
            total_actions,
            service_requests_created,
            orders_viewed,
            invoices_viewed,
            feedback_submitted,
            support_tickets_created,
            profile_updates,
            login_count,
            last_activity
        ) VALUES (
            NEW.user_id,
            NEW.created_at::date,
            1,
            CASE WHEN NEW.action_type = 'service_request_create' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'order_view' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'invoice_view' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'feedback_submit' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'support_ticket_create' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_category = 'profile' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (customer_id, date) DO UPDATE SET
            total_actions = customer_activity_summary.total_actions + 1,
            service_requests_created = customer_activity_summary.service_requests_created + 
                CASE WHEN NEW.action_type = 'service_request_create' THEN 1 ELSE 0 END,
            orders_viewed = customer_activity_summary.orders_viewed + 
                CASE WHEN NEW.action_type = 'order_view' THEN 1 ELSE 0 END,
            invoices_viewed = customer_activity_summary.invoices_viewed + 
                CASE WHEN NEW.action_type = 'invoice_view' THEN 1 ELSE 0 END,
            feedback_submitted = customer_activity_summary.feedback_submitted + 
                CASE WHEN NEW.action_type = 'feedback_submit' THEN 1 ELSE 0 END,
            support_tickets_created = customer_activity_summary.support_tickets_created + 
                CASE WHEN NEW.action_type = 'support_ticket_create' THEN 1 ELSE 0 END,
            profile_updates = customer_activity_summary.profile_updates + 
                CASE WHEN NEW.action_category = 'profile' THEN 1 ELSE 0 END,
            login_count = customer_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_activity_summary();

-- Helper function to log customer activities
CREATE OR REPLACE FUNCTION log_customer_activity(
    p_customer_id TEXT,
    p_action_type TEXT,
    p_action_category TEXT,
    p_description TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    activity_id INTEGER;
BEGIN
    INSERT INTO system_activity (
        user_id, user_role, action_type, action_category, description,
        entity_type, entity_id, metadata, session_id, ip_address, user_agent
    ) VALUES (
        p_customer_id, 'customer', p_action_type, p_action_category, p_description,
        p_entity_type, p_entity_id, p_metadata, p_session_id, 
        p_ip_address::INET, p_user_agent
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create customer notification
CREATE OR REPLACE FUNCTION create_customer_notification(
    p_customer_id TEXT,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'normal',
    p_category TEXT DEFAULT NULL,
    p_delivery_channel TEXT DEFAULT 'app',
    p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO customer_notifications (
        customer_id, notification_type, title, message, priority,
        category, delivery_channel, scheduled_for, expires_at, metadata
    ) VALUES (
        p_customer_id, p_notification_type, p_title, p_message, p_priority,
        p_category, p_delivery_channel, p_scheduled_for, p_expires_at, p_metadata
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;