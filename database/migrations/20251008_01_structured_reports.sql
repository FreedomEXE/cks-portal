-- +migrate Up
-- Add columns for structured report/feedback data
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS report_category VARCHAR(50),  -- 'service', 'product', 'order', 'procedure'
ADD COLUMN IF NOT EXISTS related_entity_id VARCHAR(64), -- ID of the service/product/order/procedure
ADD COLUMN IF NOT EXISTS report_reason VARCHAR(100);  -- Predefined reason from dropdown

-- +migrate Down
ALTER TABLE reports
DROP COLUMN IF EXISTS report_reason,
DROP COLUMN IF EXISTS related_entity_id,
DROP COLUMN IF EXISTS report_category;
