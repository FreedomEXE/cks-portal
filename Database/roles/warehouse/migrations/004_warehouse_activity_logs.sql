/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 004_warehouse_activity_logs.sql
 * 
 * Description: Activity logging system for tracking warehouse operations and inventory events
 * Function: Track auditable warehouse actions and inventory-related events
 * Importance: Supports audits, inventory tracking, and warehouse management analytics
 * Connects to: Services that log actions; Activity UI; activity.repo.ts
 * 
 * Notes: Comprehensive activity tracking system focused on warehouse operations and inventory
 */

-- System activity logs - comprehensive tracking for all warehouse actions
CREATE TABLE IF NOT EXISTS system_activity (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL, -- References users(user_id)
    user_role TEXT NOT NULL, -- 'warehouse', 'manager', etc.
    action_type TEXT NOT NULL, -- 'stock_receipt', 'inventory_count', 'delivery_schedule', etc.
    action_category TEXT NOT NULL, -- 'inventory', 'deliveries', 'stock', 'operations', etc.
    description TEXT NOT NULL,
    entity_type TEXT, -- 'inventory_item', 'delivery', 'stock_movement', etc.
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

-- Warehouse-specific activity tracking for operations and inventory management
CREATE TABLE IF NOT EXISTS warehouse_activity_summary (
    id SERIAL PRIMARY KEY,
    warehouse_id TEXT NOT NULL, -- References users(user_id)
    date DATE NOT NULL,
    total_actions INTEGER DEFAULT 0,
    stock_receipts INTEGER DEFAULT 0,
    stock_shipments INTEGER DEFAULT 0,
    inventory_adjustments INTEGER DEFAULT 0,
    deliveries_scheduled INTEGER DEFAULT 0,
    deliveries_completed INTEGER DEFAULT 0,
    cycle_counts_performed INTEGER DEFAULT 0,
    login_count INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    value_processed DECIMAL(12,2) DEFAULT 0,
    last_activity TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(warehouse_id, date)
);

-- Warehouse notifications and alerts
CREATE TABLE IF NOT EXISTS warehouse_notifications (
    id SERIAL PRIMARY KEY,
    warehouse_id TEXT NOT NULL, -- References users(user_id)
    notification_type TEXT NOT NULL, -- 'low_stock', 'delivery_due', 'cycle_count_due', etc.
    title TEXT NOT NULL,
    message TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    category TEXT, -- 'inventory', 'deliveries', 'maintenance', 'compliance'
    related_entity_type TEXT,
    related_entity_id TEXT,
    action_required BOOLEAN DEFAULT FALSE,
    action_deadline TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    delivery_method TEXT DEFAULT 'app' CHECK (delivery_method IN ('app', 'email', 'sms', 'push')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_system_activity_warehouse_date ON system_activity(user_id, created_at DESC) WHERE user_role = 'warehouse';
CREATE INDEX IF NOT EXISTS idx_system_activity_warehouse_category ON system_activity(action_category, created_at DESC) WHERE user_role = 'warehouse';
CREATE INDEX IF NOT EXISTS idx_warehouse_activity_summary_warehouse_date ON warehouse_activity_summary(warehouse_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_warehouse_notifications_warehouse ON warehouse_notifications(warehouse_id, created_at DESC);

-- Update trigger for warehouse activity summary
CREATE OR REPLACE FUNCTION update_warehouse_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_role = 'warehouse' THEN
        INSERT INTO warehouse_activity_summary (
            warehouse_id, date, total_actions,
            stock_receipts, stock_shipments, inventory_adjustments,
            deliveries_scheduled, deliveries_completed, cycle_counts_performed,
            login_count, last_activity
        ) VALUES (
            NEW.user_id, NEW.created_at::date, 1,
            CASE WHEN NEW.action_type = 'stock_receipt' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'stock_shipment' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'inventory_adjustment' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'delivery_schedule' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'delivery_complete' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'cycle_count' THEN 1 ELSE 0 END,
            CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            NEW.created_at
        ) ON CONFLICT (warehouse_id, date) DO UPDATE SET
            total_actions = warehouse_activity_summary.total_actions + 1,
            stock_receipts = warehouse_activity_summary.stock_receipts + 
                CASE WHEN NEW.action_type = 'stock_receipt' THEN 1 ELSE 0 END,
            stock_shipments = warehouse_activity_summary.stock_shipments + 
                CASE WHEN NEW.action_type = 'stock_shipment' THEN 1 ELSE 0 END,
            inventory_adjustments = warehouse_activity_summary.inventory_adjustments + 
                CASE WHEN NEW.action_type = 'inventory_adjustment' THEN 1 ELSE 0 END,
            deliveries_scheduled = warehouse_activity_summary.deliveries_scheduled + 
                CASE WHEN NEW.action_type = 'delivery_schedule' THEN 1 ELSE 0 END,
            deliveries_completed = warehouse_activity_summary.deliveries_completed + 
                CASE WHEN NEW.action_type = 'delivery_complete' THEN 1 ELSE 0 END,
            cycle_counts_performed = warehouse_activity_summary.cycle_counts_performed + 
                CASE WHEN NEW.action_type = 'cycle_count' THEN 1 ELSE 0 END,
            login_count = warehouse_activity_summary.login_count + 
                CASE WHEN NEW.action_type = 'login' THEN 1 ELSE 0 END,
            last_activity = NEW.created_at,
            updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_warehouse_activity_summary
    AFTER INSERT ON system_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_activity_summary();