import { query } from './connection';
import { seedCatalogData } from './seed-catalog';
import { fixOrdersTable } from './fix-orders-table';

export async function initializeSequences() {
  try {
    await query(`CREATE SEQUENCE IF NOT EXISTS order_product_sequence AS BIGINT START 1`, []);
    console.log('Created/verified order_product_sequence');

    await query(`CREATE SEQUENCE IF NOT EXISTS order_service_sequence AS BIGINT START 1`, []);
    console.log('Created/verified order_service_sequence');

    await query(`CREATE SEQUENCE IF NOT EXISTS support_ticket_id_seq AS BIGINT START 1`, []);
    console.log('Created/verified support_ticket_id_seq');

    await fixOrdersTable();

    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
        line_number INTEGER NOT NULL DEFAULT 1,
        catalog_item_code VARCHAR(32),
        name TEXT NOT NULL,
        item_type TEXT NOT NULL CHECK (item_type IN ('product','service')),
        description TEXT,
        quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
        unit_of_measure TEXT,
        unit_price NUMERIC(12,2),
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        total_price NUMERIC(12,2),
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        product_id VARCHAR(32),
        service_id VARCHAR(32),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(order_id, line_number)
      )
    `, []);
    console.log('Created/verified order_items table');

    await query(`
      ALTER TABLE order_items
        ADD COLUMN IF NOT EXISTS unit_of_measure TEXT,
        ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS product_id VARCHAR(32),
        ADD COLUMN IF NOT EXISTS service_id VARCHAR(32)
    `, []);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_order_items_product'
        ) THEN
          ALTER TABLE order_items
            ADD CONSTRAINT fk_order_items_product
            FOREIGN KEY (product_id) REFERENCES catalog_products(product_id);
        END IF;
      END $$
    `, []);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_order_items_service'
        ) THEN
          ALTER TABLE order_items
            ADD CONSTRAINT fk_order_items_service
            FOREIGN KEY (service_id) REFERENCES catalog_services(service_id);
        END IF;
      END $$
    `, []);

    await query(`
      CREATE TABLE IF NOT EXISTS catalog_products (
        product_id VARCHAR(32) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}'::text[],
        category TEXT,
        unit_of_measure TEXT,
        base_price NUMERIC(12,2),
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        sku TEXT,
        package_size TEXT,
        lead_time_days INTEGER,
        reorder_point INTEGER,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified catalog_products table');

    await query(`
      CREATE TABLE IF NOT EXISTS catalog_services (
        service_id VARCHAR(32) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        tags TEXT[] NOT NULL DEFAULT '{}'::text[],
        category TEXT,
        unit_of_measure TEXT,
        base_price NUMERIC(12,2),
        currency CHAR(3) NOT NULL DEFAULT 'USD',
        duration_minutes INTEGER,
        service_window TEXT,
        crew_required INTEGER,
        attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified catalog_services table');

    await query(`
      CREATE TABLE IF NOT EXISTS catalog_ecosystem_visibility_policies (
        ecosystem_manager_id VARCHAR(64) NOT NULL,
        item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
        visibility_mode TEXT NOT NULL DEFAULT 'all' CHECK (visibility_mode IN ('all', 'allowlist')),
        updated_by VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (ecosystem_manager_id, item_type)
      )
    `, []);
    console.log('Created/verified catalog_ecosystem_visibility_policies table');

    await query(`
      CREATE TABLE IF NOT EXISTS catalog_ecosystem_visibility_items (
        id BIGSERIAL PRIMARY KEY,
        ecosystem_manager_id VARCHAR(64) NOT NULL,
        item_type TEXT NOT NULL CHECK (item_type IN ('product', 'service')),
        item_code VARCHAR(32) NOT NULL,
        created_by VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(ecosystem_manager_id, item_type, item_code)
      )
    `, []);
    console.log('Created/verified catalog_ecosystem_visibility_items table');

    // Service certifications (per individual)
    await query(`
      CREATE TABLE IF NOT EXISTS service_certifications (
        id BIGSERIAL PRIMARY KEY,
        service_id VARCHAR(32) NOT NULL REFERENCES catalog_services(service_id) ON DELETE CASCADE,
        user_id VARCHAR(64) NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('manager','contractor','crew','warehouse')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ,
        UNIQUE(service_id, user_id, role)
      )
    `, []);
    console.log('Created/verified service_certifications table');

    // Contractor offerings (which services a contractor offers)
    await query(`
      CREATE TABLE IF NOT EXISTS contractor_service_offerings (
        id BIGSERIAL PRIMARY KEY,
        contractor_id VARCHAR(64) NOT NULL,
        service_id VARCHAR(32) NOT NULL REFERENCES catalog_services(service_id) ON DELETE CASCADE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ,
        UNIQUE(contractor_id, service_id)
      )
    `, []);
    console.log('Created/verified contractor_service_offerings table');

    await query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified warehouses table');

    // No longer inserting a default warehouse - warehouses should be created through proper registration

    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_code VARCHAR(64) PRIMARY KEY,
        preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified user_preferences table');

    await query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id VARCHAR(64) PRIMARY KEY,
        issue_type TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        steps_to_reproduce TEXT,
        screenshot_url TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        created_by_role TEXT NOT NULL,
        created_by_id VARCHAR(64) NOT NULL,
        cks_manager VARCHAR(64),
        resolution_notes TEXT,
        action_taken TEXT,
        resolved_by_id VARCHAR(64),
        resolved_at TIMESTAMPTZ,
        archived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified support_tickets table');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_manager_status
      ON support_tickets (cks_manager, status, created_at DESC)
      WHERE archived_at IS NULL
    `, []);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_creator
      ON support_tickets (created_by_id, created_at DESC)
      WHERE archived_at IS NULL
    `, []);

    await seedCatalogData();

    console.log('Database sequences and tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database sequences:', error);
  }
}
