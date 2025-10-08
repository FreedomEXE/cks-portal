-- +migrate Up
-- Align reports table with application expectations
DO $$
BEGIN
  IF to_regclass('public.reports') IS NULL THEN
    RAISE NOTICE 'reports table missing; skipping alignment (use create migration instead)';
  ELSE
    ALTER TABLE public.reports
      ADD COLUMN IF NOT EXISTS report_id VARCHAR(16),
      ADD COLUMN IF NOT EXISTS type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS severity VARCHAR(20),
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS service_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS center_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(20),
      ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS tags TEXT[];

    -- Ensure primary identifier exists; if table uses a different PK, this will be a no-op
    BEGIN
      ALTER TABLE public.reports ADD CONSTRAINT reports_pk PRIMARY KEY (report_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      -- Constraint already exists or another PK present
      NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_by_center ON public.reports(center_id);
    CREATE INDEX IF NOT EXISTS idx_reports_by_customer ON public.reports(customer_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.reports(created_by_id, created_by_role);
  END IF;
END $$;

-- Align feedback table with application expectations
DO $$
BEGIN
  IF to_regclass('public.feedback') IS NULL THEN
    RAISE NOTICE 'feedback table missing; skipping alignment (use create migration instead)';
  ELSE
    ALTER TABLE public.feedback
      ADD COLUMN IF NOT EXISTS feedback_id VARCHAR(16),
      ADD COLUMN IF NOT EXISTS kind VARCHAR(50),
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS message TEXT,
      ADD COLUMN IF NOT EXISTS center_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(20),
      ADD COLUMN IF NOT EXISTS created_by_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

    BEGIN
      ALTER TABLE public.feedback ADD CONSTRAINT feedback_pk PRIMARY KEY (feedback_id);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
    CREATE INDEX IF NOT EXISTS idx_feedback_by_center ON public.feedback(center_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_by_customer ON public.feedback(customer_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_created_by ON public.feedback(created_by_id, created_by_role);
  END IF;
END $$;

-- +migrate Down
-- This alignment is additive; no-op on Down to avoid dropping production columns
SELECT 1;

