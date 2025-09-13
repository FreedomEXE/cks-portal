/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_crew_users.sql
 * 
 * Description: Creates orgs and users (incl. role_code, template_version) for Crew role.
 * Function: Define base org and user tables used across Crew features.
 * Importance: Core identity and org scoping for the Crew hub.
 * Connects to: Backend auth middleware (loads user+role), Crew routes.
 * 
 * Notes: Initial schema per review - crew-specific user management.
 */

-- users table (minimal fields for Crew vertical slice)
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