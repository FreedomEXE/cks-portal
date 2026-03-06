/*-----------------------------------------------
  Property of Freedom_EXE  (c) 2026
-----------------------------------------------*/

const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function createSupportTicketTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`CREATE SEQUENCE IF NOT EXISTS support_ticket_id_seq AS BIGINT START 1`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        ticket_id VARCHAR(64) PRIMARY KEY,
        issue_type TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        steps_to_reproduce TEXT,
        screenshot_url TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'escalated', 'resolved', 'closed', 'cancelled')),
        created_by_role TEXT NOT NULL,
        created_by_id VARCHAR(64) NOT NULL,
        cks_manager VARCHAR(64),
        assigned_to VARCHAR(64),
        reopened_count INTEGER NOT NULL DEFAULT 0,
        resolution_notes TEXT,
        action_taken TEXT,
        resolved_by_id VARCHAR(64),
        resolved_at TIMESTAMPTZ,
        archived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE support_tickets
        ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(64),
        ADD COLUMN IF NOT EXISTS reopened_count INTEGER NOT NULL DEFAULT 0
    `);

    await client.query(`
      UPDATE support_tickets
      SET status = 'in_progress'
      WHERE LOWER(status) = 'in-progress'
    `);

    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;
        ALTER TABLE support_tickets
          ADD CONSTRAINT support_tickets_status_check
          CHECK (status IN ('open', 'in_progress', 'waiting_on_user', 'escalated', 'resolved', 'closed', 'cancelled'));
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS support_ticket_comments (
        comment_id BIGSERIAL PRIMARY KEY,
        ticket_id VARCHAR(64) NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
        author_id VARCHAR(64) NOT NULL,
        author_role VARCHAR(64) NOT NULL,
        body TEXT NOT NULL,
        is_internal BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_manager_status
      ON support_tickets (cks_manager, status, created_at DESC)
      WHERE archived_at IS NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_creator
      ON support_tickets (created_by_id, created_at DESC)
      WHERE archived_at IS NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
      ON support_tickets (assigned_to, status, updated_at DESC)
      WHERE archived_at IS NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_tickets_priority_status
      ON support_tickets (priority, status)
      WHERE archived_at IS NULL
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket
      ON support_ticket_comments (ticket_id, created_at)
    `);

    console.log('Support ticket tables and indexes verified');
  } catch (error) {
    console.error('Failed to create support ticket tables:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

createSupportTicketTables();

