-- Create sequences needed for order generation
CREATE SEQUENCE IF NOT EXISTS order_product_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS order_service_sequence START 1;

-- Verify sequences were created
SELECT
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE sequencename IN ('order_product_sequence', 'order_service_sequence');