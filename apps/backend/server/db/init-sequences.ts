import { query } from './connection';
import { seedCatalogData } from './seed-catalog';
import { fixOrdersTable } from './fix-orders-table';

export async function initializeSequences() {
  try {
    await query(`CREATE SEQUENCE IF NOT EXISTS order_product_sequence AS BIGINT START 1`, []);
    console.log('Created/verified order_product_sequence');

    await query(`CREATE SEQUENCE IF NOT EXISTS order_service_sequence AS BIGINT START 1`, []);
    console.log('Created/verified order_service_sequence');

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
      CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `, []);
    console.log('Created/verified warehouses table');

    // No longer inserting a default warehouse - warehouses should be created through proper registration

    await seedCatalogData();

    console.log('Database sequences and tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database sequences:', error);
  }
}
