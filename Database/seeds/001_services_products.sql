-- Seed: 001_services_products.sql
-- Description: Initial services and products catalog data
-- This will be populated when the partner provides the official list

-- Clear existing data (for development)
DELETE FROM products WHERE product_id LIKE 'SEED-%';
DELETE FROM services WHERE service_id LIKE 'SEED-%';

-- Sample Services (to be replaced with actual data)
INSERT INTO services (service_id, service_name, category, description, pricing_model, status) VALUES
('SEED-SRV-001', 'General Cleaning', 'Cleaning', 'Standard cleaning services for commercial spaces', 'Hourly', 'active'),
('SEED-SRV-002', 'Deep Cleaning', 'Cleaning', 'Intensive deep cleaning services', 'Project-based', 'active'),
('SEED-SRV-003', 'Window Cleaning', 'Cleaning', 'Interior and exterior window cleaning', 'Per window', 'active'),
('SEED-SRV-004', 'Carpet Cleaning', 'Cleaning', 'Professional carpet and upholstery cleaning', 'Per square foot', 'active'),
('SEED-SRV-005', 'Facility Maintenance', 'Maintenance', 'General facility maintenance and repairs', 'Service call', 'active'),
('SEED-SRV-006', 'HVAC Maintenance', 'Maintenance', 'Heating, ventilation, and air conditioning maintenance', 'Service call', 'active'),
('SEED-SRV-007', 'Landscaping', 'Outdoor', 'Grounds keeping and landscaping services', 'Monthly contract', 'active'),
('SEED-SRV-008', 'Snow Removal', 'Outdoor', 'Snow plowing and ice management', 'Seasonal contract', 'active')
ON CONFLICT (service_id) DO NOTHING;

-- Sample Products (to be replaced with actual data)
INSERT INTO products (product_id, product_name, category, description, price, unit, status) VALUES
('SEED-PRD-001', 'Multi-Surface Cleaner', 'Cleaning Supplies', 'All-purpose cleaning solution', 12.99, 'bottle', 'active'),
('SEED-PRD-002', 'Microfiber Cloths', 'Cleaning Supplies', 'High-quality microfiber cleaning cloths', 24.99, 'pack of 12', 'active'),
('SEED-PRD-003', 'Vacuum Bags', 'Equipment Supplies', 'Replacement vacuum cleaner bags', 15.99, 'pack of 10', 'active'),
('SEED-PRD-004', 'Floor Polish', 'Cleaning Supplies', 'Professional floor polish and protection', 32.99, 'gallon', 'active'),
('SEED-PRD-005', 'Toilet Paper', 'Paper Products', 'Commercial grade toilet paper', 45.99, 'case of 48', 'active'),
('SEED-PRD-006', 'Paper Towels', 'Paper Products', 'Heavy-duty paper towels', 38.99, 'case of 24', 'active'),
('SEED-PRD-007', 'Trash Bags', 'Janitorial Supplies', 'Heavy-duty trash bags', 42.99, 'case of 100', 'active'),
('SEED-PRD-008', 'Hand Sanitizer', 'Health & Safety', 'Commercial hand sanitizer', 28.99, 'gallon', 'active')
ON CONFLICT (product_id) DO NOTHING;

-- Update counts
SELECT 
    (SELECT COUNT(*) FROM services WHERE status = 'active') as active_services,
    (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products;