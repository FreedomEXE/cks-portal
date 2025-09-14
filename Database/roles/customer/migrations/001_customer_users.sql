/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 001_customer_users.sql
 * 
 * Description: Creates orgs and users (incl. role_code, template_version) for Customer role.
 * Function: Define base org and user tables used across Customer features.
 * Importance: Core identity and org scoping for the Customer hub.
 * Connects to: Backend auth middleware (loads user+role), Customer routes.
 * 
 * Notes: Initial schema per review - customer-specific user management.
 */

-- users table (minimal fields for Customer vertical slice)
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