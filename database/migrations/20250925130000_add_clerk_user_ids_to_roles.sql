-- Add Clerk user references to hub role tables
ALTER TABLE managers
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS managers_clerk_user_id_unique
  ON managers (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS contractors_clerk_user_id_unique
  ON contractors (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS customers_clerk_user_id_unique
  ON customers (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

ALTER TABLE centers
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS centers_clerk_user_id_unique
  ON centers (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

ALTER TABLE crew
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS crew_clerk_user_id_unique
  ON crew (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

ALTER TABLE warehouses
  ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(191);

CREATE UNIQUE INDEX IF NOT EXISTS warehouses_clerk_user_id_unique
  ON warehouses (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;
