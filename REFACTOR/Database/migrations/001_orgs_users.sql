/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_orgs_users.sql
 * 
 * Description: Creates orgs and users (incl. role_code, template_version).
 * Function: Define base org and user tables used across Manager features.
 * Importance: Core identity and org scoping for the Manager hub.
 * Connects to: Backend auth middleware (loads user+role), Manager routes.
 * 
 * Notes: Initial schema per review.
 */

-- users table (minimal fields for Manager vertical slice)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_code TEXT NOT NULL,
  template_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);
