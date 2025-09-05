-- Baseline bootstrap for modular schema (idempotent)
-- Shared
\i schema/shared/create_app_users.sql
\i schema/shared/create_system_activity.sql
\i schema/shared/create_catalog.sql
\i schema/shared/create_procedures.sql
\i schema/shared/create_training.sql

-- Core roles
\i schema/manager/create_managers.sql
\i schema/contractor/create_contractors.sql
\i schema/customer/create_customers.sql
\i schema/center/create_centers.sql
\i schema/crew/create_crew.sql
\i schema/warehouse/create_warehouses.sql

-- Role adjuncts
\i schema/contractor/create_contractor_services.sql

-- Shared orders/reporting
\i schema/shared/create_orders.sql

-- Migration bookkeeping
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
