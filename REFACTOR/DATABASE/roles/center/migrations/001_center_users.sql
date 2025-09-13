/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_center_users.sql
 * 
 * Description: Creates orgs and users (incl. role_code, template_version) for Center role.
 * Function: Define base org and user tables used across Center features.
 * Importance: Core identity and org scoping for the Center hub.
 * Connects to: Backend auth middleware (loads user+role), Center routes.
 * 
 * Notes: Initial schema per review - center-specific user management.
 */

-- users table (minimal fields for Center vertical slice)
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