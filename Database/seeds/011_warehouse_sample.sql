/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

-- Warehouse Hub Sample Data
-- Creates demo data for warehouse operations and inventory management

-- Sample Warehouses
INSERT INTO warehouses (warehouse_id, warehouse_name, address, manager_id, capacity, current_utilization, status) VALUES
('WH-001', 'Central Distribution Hub', '1000 Logistics Drive, Metro City, MC 12345', 'MGR-001', 50000, 32500, 'active'),
('WH-002', 'North Side Warehouse', '250 Industrial Blvd, North District, ND 67890', 'MGR-002', 25000, 18750, 'active'),
('WH-003', 'South Point Storage', '500 Commerce Way, South Point, SP 54321', 'MGR-001', 30000, 21000, 'active'),
('WH-004', 'East End Facility', '800 Supply Chain Ave, East End, EE 98765', 'MGR-003', 40000, 28000, 'active'),
('WH-005', 'West Coast Hub', '150 Shipping Lane, West Coast, WC 13579', 'MGR-002', 35000, 24500, 'active');

-- Sample Warehouse Staff
INSERT INTO warehouse_staff (staff_id, warehouse_id, staff_name, position, email, phone, shift_schedule, certifications, status, hire_date) VALUES
('WS-001', 'WH-001', 'Sarah Johnson', 'Warehouse Manager', 'sarah.johnson@cks.com', '(555) 123-4567', 'Day Shift', ARRAY['Forklift Certified', 'Safety Manager'], 'active', '2023-01-15'),
('WS-002', 'WH-001', 'Mike Chen', 'Inventory Specialist', 'mike.chen@cks.com', '(555) 234-5678', 'Day Shift', ARRAY['Inventory Management', 'WMS Certified'], 'active', '2023-03-20'),
('WS-003', 'WH-001', 'Lisa Rodriguez', 'Shipping Coordinator', 'lisa.rodriguez@cks.com', '(555) 345-6789', 'Day Shift', ARRAY['Shipping & Receiving', 'DOT Certified'], 'active', '2023-02-10'),
('WS-004', 'WH-002', 'James Wilson', 'Warehouse Supervisor', 'james.wilson@cks.com', '(555) 456-7890', 'Night Shift', ARRAY['Team Leadership', 'Quality Control'], 'active', '2023-04-05'),
('WS-005', 'WH-002', 'Amy Foster', 'Equipment Operator', 'amy.foster@cks.com', '(555) 567-8901', 'Day Shift', ARRAY['Forklift Certified', 'Crane Operation'], 'active', '2023-05-18'),
('WS-006', 'WH-003', 'David Kim', 'Receiving Clerk', 'david.kim@cks.com', '(555) 678-9012', 'Day Shift', ARRAY['Data Entry', 'Quality Inspection'], 'active', '2023-06-25');

-- Sample Inventory Items
INSERT INTO inventory_items (item_id, warehouse_id, product_id, item_name, category, sku, quantity_on_hand, quantity_reserved, min_stock_level, max_stock_level, unit_cost, location_code, status) VALUES
('INV-001', 'WH-001', 'PROD-001', 'Industrial Cleaner Concentrate', 'Cleaning Supplies', 'ICC-2024-001', 250, 50, 25, 500, 12.50, 'A1-01', 'active'),
('INV-002', 'WH-001', 'PROD-002', 'Heavy Duty Degreaser', 'Cleaning Supplies', 'HDD-2024-002', 180, 30, 20, 400, 18.75, 'A1-02', 'active'),
('INV-003', 'WH-001', 'PROD-003', 'Floor Wax Professional', 'Cleaning Supplies', 'FWP-2024-003', 95, 15, 15, 200, 24.99, 'A2-01', 'active'),
('INV-004', 'WH-002', 'PROD-004', 'Microfiber Cleaning Cloths', 'Cleaning Equipment', 'MCC-2024-004', 500, 100, 50, 1000, 2.25, 'B1-01', 'active'),
('INV-005', 'WH-002', 'PROD-005', 'Industrial Vacuum Bags', 'Equipment Parts', 'IVB-2024-005', 75, 10, 10, 150, 8.50, 'B2-03', 'active'),
('INV-006', 'WH-001', 'PROD-006', 'Safety Equipment Kit', 'Safety Supplies', 'SEK-2024-006', 40, 5, 5, 100, 45.00, 'C1-01', 'active'),
('INV-007', 'WH-003', 'PROD-007', 'Maintenance Tools Set', 'Tools & Equipment', 'MTS-2024-007', 60, 12, 8, 120, 125.00, 'D1-01', 'active'),
('INV-008', 'WH-003', 'PROD-008', 'Replacement Filter Cartridges', 'Equipment Parts', 'RFC-2024-008', 200, 40, 25, 400, 15.75, 'D2-02', 'active'),
('INV-009', 'WH-004', 'PROD-009', 'Disinfectant Spray', 'Cleaning Supplies', 'DS-2024-009', 300, 75, 40, 600, 8.99, 'E1-01', 'active'),
('INV-010', 'WH-004', 'PROD-010', 'Paper Towel Rolls', 'Janitorial Supplies', 'PTR-2024-010', 850, 150, 100, 2000, 3.25, 'E2-01', 'active');

-- Sample Warehouse Shipments
INSERT INTO warehouse_shipments (shipment_id, warehouse_id, order_id, shipment_type, tracking_number, carrier, origin_address, destination_address, shipment_date, expected_delivery_date, status, total_weight, total_value) VALUES
('SH-001', 'WH-001', 'ORD-001', 'outbound', 'TRK123456789', 'FastShip Logistics', '1000 Logistics Drive, Metro City, MC 12345', '456 Business Park, Customer Location', '2025-08-25 09:30:00', '2025-08-26 14:00:00', 'in_transit', 125.50, 485.75),
('SH-002', 'WH-002', 'ORD-002', 'outbound', 'TRK987654321', 'QuickDeliver Express', '250 Industrial Blvd, North District, ND 67890', '789 Office Complex, Client Site', '2025-08-24 14:15:00', '2025-08-25 16:30:00', 'delivered', 78.25, 312.40),
('SH-003', 'WH-001', NULL, 'inbound', 'TRK555777999', 'Supplier Transport', '100 Manufacturing St, Supplier City', '1000 Logistics Drive, Metro City, MC 12345', '2025-08-23 08:00:00', '2025-08-24 10:00:00', 'delivered', 420.75, 2150.00),
('SH-004', 'WH-003', 'ORD-003', 'outbound', 'TRK111333555', 'Regional Carriers', '500 Commerce Way, South Point, SP 54321', '321 Service Center, End User', '2025-08-26 11:45:00', '2025-08-27 09:00:00', 'pending', 95.30, 578.90),
('SH-005', 'WH-004', NULL, 'inbound', 'TRK777999111', 'Heavy Haul LLC', '200 Vendor Drive, Supply Source', '800 Supply Chain Ave, East End, EE 98765', '2025-08-27 07:30:00', '2025-08-28 12:00:00', 'in_transit', 1250.00, 8750.25);

-- Sample Shipment Items
INSERT INTO shipment_items (shipment_id, item_id, quantity, unit_price) VALUES
('SH-001', 'INV-001', 25, 12.50),
('SH-001', 'INV-003', 10, 24.99),
('SH-002', 'INV-004', 50, 2.25),
('SH-002', 'INV-005', 15, 8.50),
('SH-003', 'INV-001', 100, 11.25),
('SH-003', 'INV-002', 75, 17.50),
('SH-004', 'INV-007', 8, 125.00),
('SH-004', 'INV-008', 25, 15.75),
('SH-005', 'INV-009', 200, 7.99),
('SH-005', 'INV-010', 500, 2.95);

-- Sample Warehouse Activity Log
INSERT INTO warehouse_activity_log (warehouse_id, activity_type, item_id, shipment_id, staff_id, quantity_change, description) VALUES
('WH-001', 'stock_received', 'INV-001', 'SH-003', 'WS-002', 100, 'Received industrial cleaner concentrate shipment'),
('WH-001', 'stock_shipped', 'INV-001', 'SH-001', 'WS-003', -25, 'Shipped 25 units to customer ORD-001'),
('WH-002', 'stock_adjustment', 'INV-004', NULL, 'WS-004', -5, 'Damaged items removed from inventory'),
('WH-001', 'stock_received', 'INV-002', 'SH-003', 'WS-002', 75, 'Received heavy duty degreaser shipment'),
('WH-003', 'stock_shipped', 'INV-007', 'SH-004', 'WS-006', -8, 'Shipped maintenance tools set'),
('WH-004', 'inventory_count', 'INV-009', NULL, 'WS-005', 0, 'Physical inventory count completed - matches system'),
('WH-001', 'low_stock_alert', 'INV-006', NULL, 'WS-001', 0, 'Safety equipment kit below minimum threshold'),
('WH-002', 'equipment_maintenance', NULL, NULL, 'WS-005', 0, 'Forklift FL-002 scheduled maintenance completed');