CREATE TABLE IF NOT EXISTS access_codes (
  code TEXT PRIMARY KEY,
  target_role TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'active',
  max_redemptions INTEGER NOT NULL DEFAULT 1,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  scope_role TEXT NULL,
  scope_code TEXT NULL,
  cascade BOOLEAN NOT NULL DEFAULT false,
  created_by_role TEXT NULL,
  created_by_code TEXT NULL,
  notes TEXT NULL,
  expires_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_grants (
  grant_id BIGSERIAL PRIMARY KEY,
  cks_code TEXT NOT NULL,
  role TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  source_code TEXT NOT NULL REFERENCES access_codes(code) ON DELETE RESTRICT,
  cascade BOOLEAN NOT NULL DEFAULT false,
  granted_by_role TEXT NULL,
  granted_by_code TEXT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes(status);
CREATE INDEX IF NOT EXISTS idx_access_codes_role ON access_codes(target_role);
CREATE INDEX IF NOT EXISTS idx_access_codes_scope ON access_codes(scope_role, scope_code);

CREATE INDEX IF NOT EXISTS idx_access_grants_code ON access_grants(UPPER(cks_code));
CREATE INDEX IF NOT EXISTS idx_access_grants_role ON access_grants(role);

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_grants_active
  ON access_grants(UPPER(cks_code), role)
  WHERE status = 'active';
