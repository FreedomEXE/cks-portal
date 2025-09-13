/*───────────────────────────────────────────────
 Property of CKS  © 2025
 Manifested by Freedom
───────────────────────────────────────────────*/

/**
 * File: 000_extensions.sql
 *
 * Description: Enable required PostgreSQL extensions
 * Function: Setup database extensions needed for CKS Portal
 * Importance: Foundation for UUID, JSON operations, and security features
 * Connects to: All subsequent migrations and RLS policies
 */

-- Enable UUID extension for generating UUIDs if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing and security functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable case-insensitive text comparisons
CREATE EXTENSION IF NOT EXISTS "citext";

-- Enable Row Level Security helper functions
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";

-- Set default timezone
SET timezone = 'UTC';